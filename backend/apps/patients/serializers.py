from datetime import date
from pathlib import Path

from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from apps.branches.models import Branch
from apps.departments.models import Department
from apps.hospitals.models import Hospital

from .models import Patient

User = get_user_model()

SUPERUSER_ROLES = {"SUPER_USER", "SUPER_ADMIN"}
ADMIN_ROLES = SUPERUSER_ROLES | {"HOSPITAL_ADMIN"}
MANAGEMENT_ROLES = ADMIN_ROLES | {"RECEPTIONIST"}


# ============================================================
# SHARED VALIDATION
# ============================================================

def validate_mobile(value):
    if value in (None, ""):
        return None

    value = value.strip()
    digits = value[1:] if value.startswith("+") else value

    if not digits.isdigit() or not 10 <= len(digits) <= 15:
        raise serializers.ValidationError(
            "Enter a valid mobile number containing 10–15 digits."
        )

    return value


def validate_patient_document(upload):
    if not upload:
        return upload

    allowed_extensions = {".pdf", ".jpg", ".jpeg", ".png"}
    extension = Path(upload.name).suffix.lower()

    if extension not in allowed_extensions:
        raise serializers.ValidationError(
            "Only PDF, JPG, JPEG and PNG documents are allowed."
        )

    if upload.size > 5 * 1024 * 1024:
        raise serializers.ValidationError(
            "Document size must not exceed 5 MB."
        )

    return upload


def validate_password(password, user=None):
    try:
        password_validation.validate_password(password, user=user)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(list(exc.messages))

    return password


def branch_is_usable(branch):
    if not branch or not branch.hospital_id:
        return False

    if branch.status != "ACTIVE":
        return False

    return branch.hospital.status == "ACTIVE"


def actor_can_access_branch(actor, branch):
    if actor.role in SUPERUSER_ROLES:
        return bool(actor.is_superuser)

    if actor.role == "HOSPITAL_ADMIN":
        return (
            actor.is_active
            and actor.is_approved
            and actor.hospital_id == branch.hospital_id
        )

    if actor.role == "RECEPTIONIST":
        return (
            actor.is_active
            and actor.is_approved
            and actor.branch_id == branch.id
        )

    return False


# ============================================================
# PATIENT LIST / DETAIL SERIALIZER
# ============================================================

class PatientSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
        default=None,
    )

    hospital_id = serializers.SerializerMethodField()
    hospital_name = serializers.SerializerMethodField()

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True,
        default=None,
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
        default=None,
    )

    assigned_doctor_name = serializers.SerializerMethodField()
    full_name = serializers.ReadOnlyField()
    is_active = serializers.SerializerMethodField()
    registration_complete = serializers.ReadOnlyField()
    registration_status = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id",
            "patient_id",
            "user",
            "username",
            "first_name",
            "middle_name",
            "last_name",
            "full_name",
            "date_of_birth",
            "gender",
            "email",
            "mobile_number",
            "address_line",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
            "blood_group",
            "allergies",
            "medical_history",
            "emergency_contact",
            "emergency_phone",
            "insurance_provider",
            "insurance_number",
            "id_proof_type",
            "id_proof_number",
            "id_proof_document",
            "hospital_id",
            "hospital_name",
            "branch",
            "branch_name",
            "department",
            "department_name",
            "assigned_doctor",
            "assigned_doctor_name",
            "email_verified",
            "mobile_verified",
            "is_active",
            "registration_complete",
            "registration_status",
            "is_archived",
            "archived_at",
            "archive_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_hospital_id(self, obj):
        if obj.branch_id:
            return obj.branch.hospital_id
        return None

    def get_hospital_name(self, obj):
        if obj.branch_id and obj.branch.hospital_id:
            return obj.branch.hospital.name
        return None

    def get_assigned_doctor_name(self, obj):
        doctor = obj.assigned_doctor
        if not doctor:
            return None
        return doctor.get_full_name() or doctor.username

    def get_is_active(self, obj):
        return bool(obj.user_id and obj.user.is_active)

    def get_registration_status(self, obj):
        return "COMPLETED" if obj.registration_complete else "INCOMPLETE"


# ============================================================
# ADMIN / RECEPTIONIST CREATES A PATIENT ACCOUNT
# ============================================================

class PatientAccountCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )
    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)

    mobile_number = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=16,
    )

    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.select_related("hospital").all()
    )

    def validate_username(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError("Username is required.")

        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists.")

        return value

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already exists.")

        if Patient.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "A patient with this email already exists."
            )

        return value

    def validate_mobile_number(self, value):
        value = validate_mobile(value)

        if value and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError(
                "This mobile number is already in use."
            )

        if value and Patient.objects.filter(
            mobile_number=value
        ).exists():
            raise serializers.ValidationError(
                "This mobile number is already assigned to a patient."
            )

        return value or ""

    def validate(self, attrs):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required."
            )

        actor = request.user
        branch = attrs["branch"]

        if actor.role not in MANAGEMENT_ROLES:
            raise serializers.ValidationError(
                "You are not allowed to create patient accounts."
            )

        if not actor.is_active:
            raise serializers.ValidationError("Your account is inactive.")

        if actor.role in {"HOSPITAL_ADMIN", "RECEPTIONIST"}:
            if not actor.is_approved:
                raise serializers.ValidationError(
                    "Your account has not been approved."
                )

        if not actor_can_access_branch(actor, branch):
            raise serializers.ValidationError({
                "branch": "You cannot create patients in this branch."
            })

        if not branch_is_usable(branch):
            raise serializers.ValidationError({
                "branch": "Select a branch linked to an active hospital."
            })

        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        validate_password(attrs["password"])

        attrs["first_name"] = attrs["first_name"].strip()
        attrs["last_name"] = attrs["last_name"].strip()

        if not attrs["first_name"] or not attrs["last_name"]:
            raise serializers.ValidationError(
                "First name and last name are required."
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        branch = validated_data.pop("branch")
        mobile = validated_data.pop("mobile_number", "") or None

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=password,
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            phone=mobile,
            role="PATIENT",
            hospital=branch.hospital,
            branch=branch,
            is_active=True,
            is_approved=True,
            is_email_verified=True,
        )

        return Patient.objects.create(
            user=user,
            branch=branch,
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            email=validated_data["email"],
            mobile_number=mobile,
            email_verified=True,
            mobile_verified=False,
        )


# ============================================================
# PATIENT PROFILE / COMPLETE REGISTRATION
# ============================================================

class PatientCompleteRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            "first_name",
            "middle_name",
            "last_name",
            "date_of_birth",
            "gender",
            "email",
            "mobile_number",
            "address_line",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
            "blood_group",
            "allergies",
            "medical_history",
            "emergency_contact",
            "emergency_phone",
            "insurance_provider",
            "insurance_number",
            "id_proof_type",
            "id_proof_number",
            "id_proof_document",
            "branch",
            "department",
            "assigned_doctor",
        ]

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        actor = getattr(request, "user", None)

        if actor and getattr(actor, "role", None) == "PATIENT":
            for name in ("branch", "department", "assigned_doctor"):
                fields[name].read_only = True

        return fields

    def validate_date_of_birth(self, value):
        if value and value > date.today():
            raise serializers.ValidationError(
                "Date of birth cannot be in the future."
            )
        return value

    def validate_mobile_number(self, value):
        return validate_mobile(value)

    def validate_id_proof_document(self, upload):
        return validate_patient_document(upload)

    def validate_email(self, value):
        value = value.strip().lower()
        patient = self.instance

        if Patient.objects.filter(
            email__iexact=value
        ).exclude(pk=patient.pk).exists():
            raise serializers.ValidationError(
                "A patient with this email already exists."
            )

        if patient.user_id and User.objects.filter(
            email__iexact=value
        ).exclude(pk=patient.user_id).exists():
            raise serializers.ValidationError(
                "This email is already used by another account."
            )

        return value

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        patient = self.instance

        if not actor or not actor.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required."
            )

        if patient.is_archived:
            raise serializers.ValidationError(
                "Archived patient records cannot be edited."
            )

        if actor.role == "PATIENT":
            if patient.user_id != actor.id:
                raise serializers.ValidationError(
                    "You can update only your own patient profile."
                )

        elif actor.role not in MANAGEMENT_ROLES:
            raise serializers.ValidationError(
                "You are not allowed to update this patient."
            )

        branch = attrs.get("branch", patient.branch)
        department = attrs.get("department", patient.department)
        doctor = attrs.get("assigned_doctor", patient.assigned_doctor)

        if branch is None:
            raise serializers.ValidationError({
                "branch": "A branch must be selected."
            })

        if actor.role in {"HOSPITAL_ADMIN", "RECEPTIONIST"}:
            if not actor_can_access_branch(actor, patient.branch):
                raise serializers.ValidationError(
                    "You cannot manage this patient."
                )

            if not actor_can_access_branch(actor, branch):
                raise serializers.ValidationError({
                    "branch": "You cannot assign this patient to that branch."
                })

        if not branch_is_usable(branch):
            raise serializers.ValidationError({
                "branch": "The selected branch or hospital is inactive."
            })

        if department:
            if department.status != "ACTIVE":
                raise serializers.ValidationError({
                    "department": "Select an active department."
                })
            if (
                department.branch_id
                and department.branch.hospital_id != branch.hospital_id
            ):
                raise serializers.ValidationError({
                    "department": "Department must belong to the selected hospital."
                })

            if (
                department.branch_id
                and department.branch_id != branch.id
            ):
                raise serializers.ValidationError({
                    "department": "Department must belong to the selected branch."
                })

        if doctor:
            if doctor.role != "DOCTOR" or not doctor.is_active:
                raise serializers.ValidationError({
                    "assigned_doctor": "Select an active doctor."
                })

            if doctor.hospital_id != branch.hospital_id:
                raise serializers.ValidationError({
                    "assigned_doctor": "Doctor must belong to the selected hospital."
                })

            if doctor.branch_id and doctor.branch_id != branch.id:
                raise serializers.ValidationError({
                    "assigned_doctor": "Doctor must belong to the selected branch."
                })

        email = attrs.get("email", patient.email)
        mobile = attrs.get("mobile_number", patient.mobile_number)

        if Patient.objects.filter(email__iexact=email).exclude(
            pk=patient.pk
        ).exists():
            raise serializers.ValidationError({
                "email": "This email is already assigned to another patient."
            })

        if mobile:
            if Patient.objects.filter(
                mobile_number=mobile
            ).exclude(pk=patient.pk).exists():
                raise serializers.ValidationError({
                    "mobile_number": "This mobile number is already assigned to another patient."
                })

            if patient.user_id and User.objects.filter(
                phone=mobile
            ).exclude(pk=patient.user_id).exists():
                raise serializers.ValidationError({
                    "mobile_number": "This mobile number is already used by another account."
                })

        if patient.user_id and User.objects.filter(
            email__iexact=email
        ).exclude(pk=patient.user_id).exists():
            raise serializers.ValidationError({
                "email": "This email is already used by another account."
            })

        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        old_email = instance.email
        patient = super().update(instance, validated_data)

        if patient.user_id:
            user = User.objects.select_for_update().get(pk=patient.user_id)
            changed_fields = []

            if user.email != patient.email:
                user.email = patient.email
                user.is_email_verified = False
                patient.email_verified = False
                changed_fields.extend(["email", "is_email_verified"])

            if user.first_name != patient.first_name:
                user.first_name = patient.first_name
                changed_fields.append("first_name")

            if user.last_name != patient.last_name:
                user.last_name = patient.last_name
                changed_fields.append("last_name")

            if user.phone != patient.mobile_number:
                user.phone = patient.mobile_number or None
                changed_fields.append("phone")

            if user.branch_id != patient.branch_id:
                user.branch = patient.branch
                changed_fields.append("branch")

            hospital_id = (
                patient.branch.hospital_id if patient.branch_id else None
            )

            if user.hospital_id != hospital_id:
                user.hospital_id = hospital_id
                changed_fields.append("hospital")

            if changed_fields:
                user.save(update_fields=list(set(changed_fields)))

            if old_email != patient.email and not patient.email_verified:
                patient.save(update_fields=["email_verified"])

        return patient
