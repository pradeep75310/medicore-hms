

from django.conf import settings
from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.hashers import check_password
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.hospitals.models import Hospital
from apps.branches.models import Branch
from apps.departments.models import Department
from .models import EmailOTP
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User

User = get_user_model()

STAFF_ROLES = (
    "DOCTOR",
    "NURSE",
    "LAB_TECHNICIAN",
    "PHARMACIST",
    "ACCOUNTANT",
    "RECEPTIONIST",
)

PATIENT_ROLE = "PATIENT"
SUPER_USER_ROLE = "SUPER_USER"
HOSPITAL_ADMIN_ROLE = "HOSPITAL_ADMIN"

OTP_PURPOSE_SUPERUSER = "SUPERUSER_REGISTER"
OTP_PURPOSE_PATIENT = "PATIENT_REGISTER"
OTP_PURPOSE_HOSPITAL_ADMIN = "HOSPITAL_ADMIN"
OTP_PURPOSE_FORGOT_PASSWORD = "FORGOT_PASSWORD"


# ---------------------------------------------------------------------
# Common helpers
# ---------------------------------------------------------------------

def normalize_email(value):
    return (value or "").strip().lower()


def validate_email_unique(value, exclude_user_id=None):
    email = normalize_email(value)

    qs = User.objects.filter(email__iexact=email)
    if exclude_user_id:
        qs = qs.exclude(pk=exclude_user_id)

    if qs.exists():
        raise serializers.ValidationError(
            "An account with this email already exists."
        )

    return email


def validate_username_unique(value, exclude_user_id=None):
    username = (value or "").strip()

    qs = User.objects.filter(username__iexact=username)
    if exclude_user_id:
        qs = qs.exclude(pk=exclude_user_id)

    if qs.exists():
        raise serializers.ValidationError(
            "This username is already in use."
        )

    return username


def actor_is_super_user(user):
    return bool(
        user
        and user.is_authenticated
        and user.is_active
        and user.is_superuser
        and getattr(user, "role", None) == SUPER_USER_ROLE
    )


def actor_is_hospital_admin(user):
    return bool(
        user
        and user.is_authenticated
        and user.is_active
        and getattr(user, "role", None) == HOSPITAL_ADMIN_ROLE
        and getattr(user, "hospital_id", None)
        and getattr(user, "is_approved", False)
    )


def require_staff_manager(actor):
    if actor_is_super_user(actor) or actor_is_hospital_admin(actor):
        return

    raise serializers.ValidationError(
        "Only an authorized Super User or Hospital Admin can perform this action."
    )


def validate_hospital_branch_department(
    hospital,
    branch,
    department=None,
    *,
    require_department=False,
):
    """
    Relationship:
        Department -> Branch -> Hospital

    A branch must belong to the selected hospital.
    A department must belong to the selected branch.
    """
    errors = {}

    if not hospital:
        errors["hospital"] = "Select a hospital."

    if not branch:
        errors["branch"] = "Select a branch."

    if hospital and branch and branch.hospital_id != hospital.pk:
        errors["branch"] = "The selected branch does not belong to this hospital."

    if require_department and not department:
        errors["department"] = "Select a department."

    if department and branch and department.branch_id != branch.pk:
        errors["department"] = (
            "The selected department does not belong to this branch."
        )

    if department and hospital and department.branch.hospital_id != hospital.pk:
        errors["department"] = (
            "The selected department does not belong to this hospital."
        )

    if errors:
        raise serializers.ValidationError(errors)


def validate_actor_hospital(actor, hospital):
    """
    Super User may work across hospitals.
    Hospital Admin is restricted to their own hospital.
    """
    require_staff_manager(actor)

    if actor_is_hospital_admin(actor):
        if not actor.hospital_id:
            raise serializers.ValidationError(
                "Your account is not assigned to a hospital."
            )

        if not hospital or hospital.pk != actor.hospital_id:
            raise serializers.ValidationError(
                "You can manage users only in your own hospital."
            )


def validate_new_password(password, user=None):
    password_validation.validate_password(password, user=user)
    return password


def latest_valid_otp(email, purpose):
  
    return (
        EmailOTP.objects.filter(
            email__iexact=normalize_email(email),
            purpose=purpose,
            is_verified=False,
        )
        .order_by("-expires_at")
        .first()
    )


def validate_otp_record(otp_record, supplied_otp):
    if not otp_record:
        raise serializers.ValidationError(
            {"otp": "No active OTP was found. Request a new OTP."}
        )

    if otp_record.expires_at <= timezone.now():
        raise serializers.ValidationError(
            {"otp": "This OTP has expired. Request a new OTP."}
        )

    if getattr(otp_record, "attempts", 0) >= 5:
        raise serializers.ValidationError(
            {"otp": "Too many attempts. Request a new OTP."}
        )

    if not check_password(str(supplied_otp), otp_record.otp_hash):
        otp_record.attempts += 1
        otp_record.save(update_fields=["attempts"])
        raise serializers.ValidationError(
            {"otp": "The OTP is incorrect."}
        )

    return otp_record


# ---------------------------------------------------------------------
# Login and current-user serializer
# ---------------------------------------------------------------------

class LoginSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    def validate(self, attrs):
        login_value = attrs.get(self.username_field)

        # Support email login when the project's USERNAME_FIELD is username.
        if self.username_field == "username" and login_value:
            login_value = str(login_value).strip()
            matching_user = User.objects.filter(
                email__iexact=login_value
            ).first()

            if matching_user:
                attrs[self.username_field] = matching_user.get_username()

        data = super().validate(attrs)
        user = self.user

        if not user.is_active:
            raise serializers.ValidationError(
                "Your account is inactive. Contact your administrator."
            )

        if not getattr(user, "is_email_verified", False):
            raise serializers.ValidationError(
                "Please verify your email before logging in."
            )

        if not getattr(user, "is_approved", False):
            raise serializers.ValidationError(
                "Your account is awaiting approval."
            )

        refresh = self.get_token(user)
        refresh["username"] = user.get_username()
        refresh["email"] = user.email
        refresh["role"] = getattr(user, "role", None)
        refresh["hospital_id"] = user.hospital_id
        refresh["branch_id"] = user.branch_id

        data["refresh"] = str(refresh)
        data["access"] = str(refresh.access_token)
        data["user"] = {
            "id": user.pk,
            "username": user.get_username(),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": getattr(user, "role", None),
            "hospital_id": user.hospital_id,
            "branch_id": user.branch_id,
            "department_id": user.department_id,
            "is_active": user.is_active,
            "is_approved": getattr(user, "is_approved", False),
            "is_email_verified": getattr(user, "is_email_verified", False),
            "profile_image": (
                self.context["request"].build_absolute_uri(user.profile_image.url)
                if getattr(user, "profile_image", None)
                and user.profile_image
                else None
            ),
        }

        return data


class MeSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="get_role_display", read_only=True)
    hospital_name = serializers.CharField(
        source="hospital.name", read_only=True, default=None
    )
    branch_name = serializers.CharField(
        source="branch.name", read_only=True, default=None
    )
    department_name = serializers.CharField(
        source="department.name", read_only=True, default=None
    )
    profile_image = serializers.ImageField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "role_name",
            "hospital",
            "hospital_name",
            "branch",
            "branch_name",
            "department",
            "department_name",
            "profile_image",
            "is_active",
            "is_approved",
            "is_email_verified",
        )
        read_only_fields = fields


# ---------------------------------------------------------------------
# Super User registration OTP
# ---------------------------------------------------------------------

class SuperUserOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    secret_key = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return validate_email_unique(value)

    def validate_secret_key(self, value):
        expected = getattr(settings, "SUPERUSER_REGISTRATION_SECRET", None)

        if not expected or value != expected:
            raise serializers.ValidationError(
                "Invalid Super User registration secret."
            )

        return value


class SuperUserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )
    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )
    otp = serializers.CharField(write_only=True, min_length=6, max_length=6)
    profile_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
            "phone",
            "profile_image",
            "otp",
        )

    def validate_username(self, value):
        return validate_username_unique(value)

    def validate_email(self, value):
        return validate_email_unique(value)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        validate_new_password(attrs["password"])

        otp_record = latest_valid_otp(
            attrs["email"], OTP_PURPOSE_SUPERUSER
        )
        validate_otp_record(otp_record, attrs["otp"])

        attrs["_otp_record"] = otp_record
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        otp_record = validated_data.pop("_otp_record")
        validated_data.pop("otp", None)
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")

        user = User.objects.create_superuser(
            password=password,
            email=normalize_email(validated_data.pop("email")),
            username=validated_data.pop("username"),
            **validated_data,
        )

        # Ensure these fields are set if the custom manager does not set them.
        user.role = SUPER_USER_ROLE
        user.is_active = True
        user.is_approved = True
        user.is_email_verified = True
        user.is_staff = True
        user.is_superuser = True
        user.save(
            update_fields=[
                "role",
                "is_active",
                "is_approved",
                "is_email_verified",
                "is_staff",
                "is_superuser",
            ]
        )

        otp_record.is_verified = True
        otp_record.save(update_fields=["is_verified"])

        return user


# ---------------------------------------------------------------------
# Shared staff creation / update
# ---------------------------------------------------------------------

class StaffCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(
        write_only=True, trim_whitespace=False
    )
    profile_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
            "phone",
            "profile_image",
            "role",
            "hospital",
            "branch",
            "department",
        )
        read_only_fields = ("id",)

    def validate_username(self, value):
        return validate_username_unique(value)

    def validate_email(self, value):
        return validate_email_unique(value)

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "user", None)

        require_staff_manager(actor)

        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        validate_new_password(attrs["password"])

        role = attrs.get("role")
        if role not in STAFF_ROLES:
            raise serializers.ValidationError(
                {"role": "Select a valid staff role."}
            )

        hospital = attrs.get("hospital")
        branch = attrs.get("branch")
        department = attrs.get("department")

        if actor_is_hospital_admin(actor):
            hospital = actor.hospital
            attrs["hospital"] = hospital

            if not branch or branch.hospital_id != hospital.pk:
                raise serializers.ValidationError(
                    {"branch": "Select a branch in your own hospital."}
                )

        validate_actor_hospital(actor, hospital)
        validate_hospital_branch_department(
            hospital,
            branch,
            department,
            require_department=True,
        )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")
        validated_data["email"] = normalize_email(validated_data["email"])

        # The User post_save signal should create the role-specific profile.
        user = User.objects.create_user(
            password=password,
            is_active=True,
            is_approved=True,
            is_email_verified=True,
            **validated_data,
        )
        return user


class PatientCreateSerializer(serializers.ModelSerializer):
    """
    Patient creation by an authenticated Super User or Hospital Admin.
    This is an admin-created patient flow, so no OTP is required.
    """

    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(
        write_only=True, trim_whitespace=False
    )
    profile_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
            "phone",
            "profile_image",
            "hospital",
            "branch",
            "department",
        )
        read_only_fields = ("id",)

    def validate_username(self, value):
        return validate_username_unique(value)

    def validate_email(self, value):
        return validate_email_unique(value)

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "user", None)

        require_staff_manager(actor)

        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        validate_new_password(attrs["password"])

        hospital = attrs.get("hospital")
        branch = attrs.get("branch")
        department = attrs.get("department")

        if actor_is_hospital_admin(actor):
            hospital = actor.hospital
            attrs["hospital"] = hospital

            if not branch or branch.hospital_id != hospital.pk:
                raise serializers.ValidationError(
                    {"branch": "Select a branch in your own hospital."}
                )

        validate_actor_hospital(actor, hospital)
        validate_hospital_branch_department(
            hospital,
            branch,
            department,
            require_department=False,
        )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")
        validated_data["email"] = normalize_email(validated_data["email"])

        return User.objects.create_user(
            password=password,
            role=PATIENT_ROLE,
            is_active=True,
            is_approved=True,
            is_email_verified=True,
            **validated_data,
        )


# ---------------------------------------------------------------------
# Patient self-registration and OTP verification
# ---------------------------------------------------------------------

class PatientRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(
        write_only=True, trim_whitespace=False
    )
    profile_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
            "phone",
            "profile_image",
            "hospital",
            "branch",
            "department",
        )
        read_only_fields = ("id",)

    def validate_username(self, value):
        return validate_username_unique(value)

    def validate_email(self, value):
        return validate_email_unique(value)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        validate_new_password(attrs["password"])

        validate_hospital_branch_department(
            attrs.get("hospital"),
            attrs.get("branch"),
            attrs.get("department"),
            require_department=False,
        )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")
        validated_data["email"] = normalize_email(validated_data["email"])

        # The user cannot log in until email OTP verification succeeds.
        return User.objects.create_user(
            password=password,
            role=PATIENT_ROLE,
            is_active=True,
            is_approved=True,
            is_email_verified=False,
            **validated_data,
        )


class PatientVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6, write_only=True)

    def validate(self, attrs):
        email = normalize_email(attrs["email"])

        user = User.objects.filter(
            email__iexact=email,
            role=PATIENT_ROLE,
        ).first()

        if not user:
            raise serializers.ValidationError(
                {"email": "Patient account not found."}
            )

        if user.is_email_verified:
            raise serializers.ValidationError(
                {"email": "This email has already been verified."}
            )

        otp_record = latest_valid_otp(email, OTP_PURPOSE_PATIENT)
        validate_otp_record(otp_record, attrs["otp"])

        attrs["user"] = user
        attrs["otp_record"] = otp_record
        return attrs




class HospitalAdminCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "hospital",
            "branch",
        ]
        extra_kwargs = {
            "hospital": {"required": True},
            "branch": {
                "required": False,
                "allow_null": True,
            },
            "phone": {
                "required": False,
                "allow_null": True,
                "allow_blank": True,
            },
            "first_name": {"required": False},
            "last_name": {"required": False},
        }

    def validate_username(self, value):
        value = value.strip()

        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "Username already registered."
            )

        return value

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Email already registered."
            )

        return value

    def validate_phone(self, value):
        if value:
            value = value.strip()

            if User.objects.filter(phone=value).exists():
                raise serializers.ValidationError(
                    "Phone number already registered."
                )

        return value

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "user", None)

        # Only Django Super User
        if not actor or not actor.is_authenticated or not actor.is_superuser:
            raise serializers.ValidationError(
                "Only Super User can create Hospital Admin."
            )

        # Hospital is required
        hospital = attrs.get("hospital")

        if hospital is None:
            raise serializers.ValidationError({
                "hospital": "Hospital is required."
            })

        # Branch is optional. If supplied, validate its hospital.
        branch = attrs.get("branch")

        if branch is not None:
            if branch.hospital_id != hospital.id:
                raise serializers.ValidationError({
                    "branch": (
                        "Selected branch does not belong "
                        "to the selected hospital."
                    )
                })

        # Password validation
        candidate_password = attrs.get("password")

        try:
            password_validation.validate_password(
                candidate_password,
                user=User(
                    username=attrs.get("username", ""),
                    email=attrs.get("email", ""),
                ),
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError({
                "password": list(exc.messages)
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password")

        email = validated_data["email"].strip().lower()
        validated_data["email"] = email

        return User.objects.create_user(
            password=password,
            role="HOSPITAL_ADMIN",
            is_active=True,
            is_approved=False,
            is_email_verified=False,
            **validated_data,
        )



class HospitalAdminVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6, write_only=True)

    def validate(self, attrs):
        email = normalize_email(attrs["email"])

        user = User.objects.filter(
            email__iexact=email,
            role=HOSPITAL_ADMIN_ROLE,
        ).first()

        if not user:
            raise serializers.ValidationError(
                {"email": "Hospital Admin account not found."}
            )

        if user.is_email_verified:
            raise serializers.ValidationError(
                {"email": "This email has already been verified."}
            )

        otp_record = latest_valid_otp(
            email, OTP_PURPOSE_HOSPITAL_ADMIN
        )
        validate_otp_record(otp_record, attrs["otp"])

        attrs["user"] = user
        attrs["otp_record"] = otp_record
        return attrs


class HospitalAdminApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "is_approved", "is_active")
        read_only_fields = ("id",)

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "user", None)

        if not actor_is_super_user(actor):
            raise serializers.ValidationError(
                "Only a Super User can approve a Hospital Admin."
            )

        if not self.instance.is_email_verified:
            raise serializers.ValidationError(
                "Verify the Hospital Admin's email before approval."
            )

        return attrs

    def update(self, instance, validated_data):
        instance.is_approved = True
        instance.is_active = True
        instance.save(update_fields=["is_approved", "is_active"])
        return instance


# ---------------------------------------------------------------------
# Staff and patient list/detail serializers
# ---------------------------------------------------------------------

class StaffListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_name = serializers.CharField(source="get_role_display", read_only=True)
    hospital_name = serializers.CharField(
        source="hospital.name", read_only=True, default=None
    )
    branch_name = serializers.CharField(
        source="branch.name", read_only=True, default=None
    )
    department_name = serializers.CharField(
        source="department.name", read_only=True, default=None
    )
    profile_image = serializers.ImageField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "role",
            "role_name",
            "hospital",
            "hospital_name",
            "branch",
            "branch_name",
            "department",
            "department_name",
            "profile_image",
            "is_active",
            "is_approved",
            "is_email_verified",
            "date_joined",
        )
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name().strip() or obj.get_username()


class StaffDetailSerializer(serializers.ModelSerializer):
    """
    Used for staff detail/update.
    Status changes should be handled by a separately protected status endpoint.
    """

    profile_image = serializers.ImageField(required=False, allow_null=True)
    role_name = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "profile_image",
            "role",
            "role_name",
            "hospital",
            "branch",
            "department",
            "is_active",
            "is_approved",
            "is_email_verified",
        )
        read_only_fields = (
            "id",
            "username",
            "email",
            "is_active",
            "is_approved",
            "is_email_verified",
        )

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        target = self.instance

        require_staff_manager(actor)

        if target and target.is_superuser:
            raise serializers.ValidationError(
                "A Super User account cannot be edited through staff management."
            )

        if target and target.role not in STAFF_ROLES:
            raise serializers.ValidationError(
                "This endpoint is only for staff accounts."
            )

        if actor_is_hospital_admin(actor):
            if target and target.hospital_id != actor.hospital_id:
                raise serializers.ValidationError(
                    "You can edit staff only in your own hospital."
                )

            if "role" in attrs and attrs["role"] not in STAFF_ROLES:
                raise serializers.ValidationError(
                    {"role": "Invalid staff role."}
                )

            attrs["hospital"] = actor.hospital

        hospital = attrs.get(
            "hospital",
            target.hospital if target else None,
        )
        branch = attrs.get(
            "branch",
            target.branch if target else None,
        )
        department = attrs.get(
            "department",
            target.department if target else None,
        )

        validate_actor_hospital(actor, hospital)
        validate_hospital_branch_department(
            hospital,
            branch,
            department,
            require_department=True,
        )

        if "role" in attrs and attrs["role"] not in STAFF_ROLES:
            raise serializers.ValidationError(
                {"role": "Select a valid staff role."}
            )

        return attrs


class PatientListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    hospital_name = serializers.CharField(
        source="hospital.name", read_only=True, default=None
    )
    branch_name = serializers.CharField(
        source="branch.name", read_only=True, default=None
    )
    department_name = serializers.CharField(
        source="department.name", read_only=True, default=None
    )
    profile_image = serializers.ImageField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "hospital",
            "hospital_name",
            "branch",
            "branch_name",
            "department",
            "department_name",
            "profile_image",
            "is_active",
            "is_approved",
            "is_email_verified",
            "date_joined",
        )
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name().strip() or obj.get_username()


class PatientDetailSerializer(serializers.ModelSerializer):
    profile_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "profile_image",
            "hospital",
            "branch",
            "department",
            "is_active",
            "is_approved",
            "is_email_verified",
        )
        read_only_fields = (
            "id",
            "username",
            "email",
            "is_active",
            "is_approved",
            "is_email_verified",
        )

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        target = self.instance

        require_staff_manager(actor)

        if target and target.role != PATIENT_ROLE:
            raise serializers.ValidationError(
                "This endpoint is only for patient accounts."
            )

        if actor_is_hospital_admin(actor):
            if target and target.hospital_id != actor.hospital_id:
                raise serializers.ValidationError(
                    "You can edit patients only in your own hospital."
                )
            attrs["hospital"] = actor.hospital

        hospital = attrs.get(
            "hospital",
            target.hospital if target else None,
        )
        branch = attrs.get(
            "branch",
            target.branch if target else None,
        )
        department = attrs.get(
            "department",
            target.department if target else None,
        )

        validate_actor_hospital(actor, hospital)
        validate_hospital_branch_department(
            hospital,
            branch,
            department,
            require_department=False,
        )

        return attrs


# ---------------------------------------------------------------------
# Forgot / reset password
# ---------------------------------------------------------------------

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        email = normalize_email(value)

        # Avoid account enumeration: the view should return the same
        # public response whether the account exists or not.
        self.account_exists = User.objects.filter(
            email__iexact=email
        ).exists()

        return email


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6, write_only=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(
        write_only=True, trim_whitespace=False
    )

    def validate(self, attrs):
        email = normalize_email(attrs["email"])

        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError(
                {"email": "Unable to reset the password for this account."}
            )

        validate_new_password(attrs["password"], user=user)

        otp_record = latest_valid_otp(
            email, OTP_PURPOSE_FORGOT_PASSWORD
        )
        validate_otp_record(otp_record, attrs["otp"])

        attrs["email"] = email
        attrs["user"] = user
        attrs["otp_record"] = otp_record
        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        user = self.validated_data["user"]
        otp_record = self.validated_data["otp_record"]

        user.set_password(self.validated_data["password"])
        user.save(update_fields=["password"])

        otp_record.is_verified = True
        otp_record.save(update_fields=["is_verified"])

        return user



# admin edit delete


from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class HospitalAdminUpdateSerializer(serializers.ModelSerializer):
    profile_image = serializers.ImageField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "profile_image",
            "hospital",
            "branch",
            "is_active",
            "is_approved",
            "is_email_verified",
        ]
        read_only_fields = [
            "id",
            "is_active",
            "is_approved",
            "is_email_verified",
        ]

    def validate_username(self, value):
        value = value.strip()
        qs = User.objects.filter(username__iexact=value)

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                "This username is already in use."
            )

        return value

    def validate_email(self, value):
        value = value.strip().lower()
        qs = User.objects.filter(email__iexact=value)

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate_phone(self, value):
        if not value:
            return value

        value = value.strip()
        qs = User.objects.filter(phone=value)

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                "This phone number is already in use."
            )

        return value

    def validate(self, attrs):
        hospital = attrs.get(
            "hospital",
            self.instance.hospital,
        )
        branch = attrs.get(
            "branch",
            self.instance.branch,
        )

        if hospital is None:
            raise serializers.ValidationError({
                "hospital": "Please select a hospital."
            })

        if branch and branch.hospital_id != hospital.id:
            raise serializers.ValidationError({
                "branch": (
                    "Selected branch does not belong "
                    "to the selected hospital."
                )
            })

        return attrs
