from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.utils import timezone
from .models import User , EmailOTP
from rest_framework_simplejwt.serializers import(
    TokenObtainPairSerializer
)

User = get_user_model()

# class for login

class LoginSerializer(TokenObtainPairSerializer):
    username_field = "username"
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["email"] = user.email
        token["role"] = user.role
        
        if user.hospital:
            token["hospital_id"] = user.hospital.id

        if user.branch:
            token["branch_id"] = user.branch.id

        return token
    
    def validate(self, attrs):
        data =  super().validate(attrs)
        user = self.user
        if not user.is_email_verified:
            raise serializers.ValidationError(
                {
                    "detail":
                        "Please verify your email using OTP first."
                }
            )

        # Super User approval required
        if not user.is_approved:
            raise serializers.ValidationError(
                {
                    "detail":
                        "Your account is waiting for approval."
                }
            )

        # Account must be active
        if not user.is_active:
            raise serializers.ValidationError(
                {
                    "detail":
                        "Your account is not active."
                }
            )

        data["user"] = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "hospital_id": (
                user.hospital.id
                if user.hospital
                else None
            ),

            "branch_id": (
                user.branch.id
                if user.branch
                else None
            )
        }

        return data

class SuperUserOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    secret_key = serializers.CharField(write_only = True)
    
    def validate(self , attrs):
        if(
            attrs["secret_key"] != __import__("django.conf" , fromlist=["settings"])
            .settings.SUPERUSER_REGISTRATION_SECRET
        ):
            raise serializers.ValidationError("invalid secret key")
        email = attrs['email'].lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Email Already regsitered")
        attrs["email"] = email
        return attrs
    
    

# user regsiter serializers  

class SuperUserRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only = True , min_length=8)
    confirm_password = serializers.CharField( write_only=True ) 
    otp = serializers.CharField(write_only=True, min_length=6,max_length=6)
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password':'passwords not match.'})
        
        email = attrs['email'].lower()
        
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email":"email alreday regsiter"})
        
        otp_obj = EmailOTP.objects.filter(
            email=email,
            purpose="SUPERUSER_REGISTER",
            is_verified=False
        ).order_by("-created_at").first()

        if not otp_obj:
            raise serializers.ValidationError({
                "otp":
                    "OTP not found."
            })
        if otp_obj.expires_at < timezone.now():
            raise serializers.ValidationError({
                "otp":
                    "OTP has expired."
        })

        if otp_obj.attempts >= 5:
            raise serializers.ValidationError({
                "otp":
                    "Too many OTP attempts."
            })

        if not check_password(
            attrs["otp"],
            otp_obj.otp_hash
        ):
            otp_obj.attempts += 1
            otp_obj.save(
                update_fields=["attempts"]
            )

            raise serializers.ValidationError({
                "otp":
                    "Invalid OTP."
            })
            
        attrs["email"] = email
        attrs["otp_obj"] = otp_obj

        return attrs

    def create(self, validated_data):

        otp_obj = validated_data.pop("otp_obj")

        validated_data.pop("confirm_password")
        validated_data.pop("otp")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            role="SUPER_USER",
            is_staff=True,
            is_superuser=True,
            is_active=True,
            is_approved=True,
            is_email_verified=True
        )

        otp_obj.is_verified = True
        otp_obj.save(
            update_fields=["is_verified"]
        )

        return user    
       
    
class StaffCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )
    confirm_password = serializers.CharField(
        write_only=True
    )

    class Meta:

        model = User

        fields = [
            "username",
            "email",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
            "phone",
            "role",
            "hospital",
            "branch",
            "department",
        ]

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(
            email__iexact=value
        ).exists():

            raise serializers.ValidationError(
                "Email already exists."
            )

        return value

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(
            username__iexact=value
        ).exists():

            raise serializers.ValidationError(
                "Username already exists."
            )
        return value
    def validate(self, attrs):
        request = self.context["request"]
        password = attrs.get("password")
        confirm_password = attrs.get(
            "confirm_password"
        )

        if password != confirm_password:

            raise serializers.ValidationError({
                "confirm_password":
                    "Passwords do not match."
            })

        role = attrs.get("role")

        allowed_roles = [
            "DOCTOR",
            "NURSE",
            "LAB_TECHNICIAN",
            "PHARMACIST",
            "ACCOUNTANT",
            "RECEPTIONIST",
        ]

        if role not in allowed_roles:

            raise serializers.ValidationError({
                "role":
                    "Only hospital staff roles are allowed."
            })

        hospital = attrs.get("hospital")
        branch = attrs.get("branch")
        department = attrs.get("department")

        # --------------------------------
        # HOSPITAL ADMIN SECURITY
        # --------------------------------

        if request.user.role == "HOSPITAL_ADMIN":

            if not request.user.hospital_id:

                raise serializers.ValidationError({
                    "hospital":
                        "Admin is not assigned to a hospital."
                })

            # Force staff into admin's hospital

            attrs["hospital"] = request.user.hospital

            hospital = request.user.hospital

        # --------------------------------
        # HOSPITAL VALIDATION
        # --------------------------------

        if not hospital:

            raise serializers.ValidationError({
                "hospital":
                    "Hospital is required."
            })

        # --------------------------------
        # BRANCH VALIDATION
        # --------------------------------

        if not branch:

            raise serializers.ValidationError({
                "branch":
                    "Branch is required."
            })

        if branch.hospital_id != hospital.id:

            raise serializers.ValidationError({
                "branch":
                    "Selected branch does not belong "
                    "to selected hospital."
            })

        # --------------------------------
        # DEPARTMENT VALIDATION
        # --------------------------------

        if department:

            if department.hospital_id != hospital.id:

                raise serializers.ValidationError({
                    "department":
                        "Selected department does not "
                        "belong to selected hospital."
                })

            # If department is branch-specific
            if department.branch_id:

                if department.branch_id != branch.id:

                    raise serializers.ValidationError({
                        "department":
                            "Selected department does not "
                            "belong to selected branch."
                    })

        return attrs

    def create(self, validated_data):

        validated_data.pop(
            "confirm_password"
        )

        password = validated_data.pop(
            "password"
        )

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        user.is_active = True
        user.is_approved = True

        user.save(
            update_fields=[
                "is_active",
                "is_approved",
            ]
        )

class PatientRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    confirm_password = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
            "phone",
        ]

    def validate(self, attrs):

        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password":
                    "Passwords do not match."
            })

        attrs["email"] = attrs["email"].lower()

        if User.objects.filter(
            email=attrs["email"]
        ).exists():

            raise serializers.ValidationError({
                "email":
                    "Email already registered."
            })

        return attrs

    def create(self, validated_data):

        validated_data.pop("confirm_password")

        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            role="PATIENT",
            is_active=True,
            is_approved=True,
            is_email_verified=False,
            **validated_data
        )

        return user 
        
    
class HospitalAdminCreateSerializer(
    serializers.ModelSerializer
):
    password = serializers.CharField(
        write_only=True,
        min_length=8
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

    def validate(self, attrs):
        request = self.context["request"]
        if not request.user.is_superuser:
            raise serializers.ValidationError(
                "Only Super User can create Hospital Admin."
            )
        hospital = attrs.get("hospital")
        if not hospital:
            raise serializers.ValidationError({
                "hospital":
                    "Hospital is required."
            })
        email = attrs["email"].strip().lower()
        if User.objects.filter(
            email__iexact=email
        ).exists():

            raise serializers.ValidationError({
                "email":
                    "Email already registered."
            })

        attrs["email"] = email
        return attrs
    def create(self, validated_data):
        password = validated_data.pop(
            "password"
        )
        user = User.objects.create_user(
            password=password,
            role="HOSPITAL_ADMIN",
            is_active=True,                                                                                  
            is_approved=False,          # Super User approval pending
            is_email_verified=False,   # OTP verify pending
            **validated_data
        )
        return user
    

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def validate(self, attrs):
        email = attrs["email"].lower()
        user = User.objects.filter(
            email=email
        ).first()
        if not user:
            raise serializers.ValidationError({
                "email":
                    "No account found with this email."
            })
        if not user.is_active:
            raise serializers.ValidationError({
                "email":
                    "This account is inactive."
            })
        attrs["email"] = email
        attrs["user"] = user
        return attrs
    
    
class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(
        min_length=6,
        max_length=6
    )
    new_password = serializers.CharField(
        min_length=8,
        write_only=True
    )

    confirm_password = serializers.CharField(
        min_length=8,
        write_only=True
    )
    def validate(self, attrs):
        email = attrs["email"].lower()
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password":
                    "Passwords do not match."
            })
        otp_obj = EmailOTP.objects.filter(
            email=email,
            purpose="FORGOT_PASSWORD",
            is_verified=False
        ).order_by("-created_at").first()
        if not otp_obj:
            raise serializers.ValidationError({
                "otp":
                    "OTP not found."
            })
        if otp_obj.expires_at < timezone.now():
            raise serializers.ValidationError({
                "otp":
                    "OTP has expired."
            })
        if otp_obj.attempts >= 5:
            raise serializers.ValidationError({
                "otp":
                    "Too many OTP attempts."
            })
        if not check_password(
            attrs["otp"],
            otp_obj.otp_hash
        ):
            otp_obj.attempts += 1
            otp_obj.save(
                update_fields=["attempts"]
            )
            raise serializers.ValidationError({
                "otp":
                    "Invalid OTP."
            })
        user = User.objects.filter(
            email=email
        ).first()
        if not user:
            raise serializers.ValidationError({
                "email":
                    "User not found."
            })
        attrs["user"] = user
        attrs["otp_obj"] = otp_obj
        return attrs
    def save(self):
        user = self.validated_data["user"]
        otp_obj = self.validated_data["otp_obj"]
        password = self.validated_data[
            "new_password"
        ]
        user.set_password(password)
        user.save(
            update_fields=["password"]
        )
        otp_obj.is_verified = True
        otp_obj.save(
            update_fields=["is_verified"]
        )
        return user         
    
    
class StaffListSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(
        source="get_role_display",
        read_only=True
    )

    hospital_name = serializers.CharField(
        source="hospital.name",
        read_only=True
    )

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    full_name = serializers.SerializerMethodField()

    class Meta:

        model = User

        fields = [
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
            "is_active",
            "is_approved",
            "date_joined",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()
    
    
    
class StaffDetailSerializer(
    serializers.ModelSerializer
):
    role_name = serializers.CharField(
        source="get_role_display",
        read_only=True
    )
    hospital_name = serializers.CharField(
        source="hospital.name",
        read_only=True
    )

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    full_name = serializers.SerializerMethodField()

    class Meta:

        model = User

        fields = [
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
            "is_active",
            "is_approved",
            "date_joined",
        ]

        read_only_fields = [
            "id",
            "username",
            "email",
            "role",
            "hospital",
            "hospital_name",
            "branch_name",
            "department_name",
            "date_joined",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() 
           
    def validate(self, attrs):
        request = self.context["request"]
        staff = self.instance
        hospital = staff.hospital
        branch = attrs.get(
            "branch",
            staff.branch
        )
        department = attrs.get(
            "department",
            staff.department
        )
        if request.user.role == "HOSPITAL_ADMIN":
            if staff.hospital_id != request.user.hospital_id:
                raise serializers.ValidationError(
                    "You cannot modify staff "
                    "from another hospital."
                )

        if branch:
            if branch.hospital_id != hospital.id:
                raise serializers.ValidationError({
                    "branch":
                        "Branch does not belong "
                        "to this hospital."
                })
        if department:
            if department.hospital_id != hospital.id:
                raise serializers.ValidationError({
                    "department":
                        "Department does not belong "
                        "to this hospital."
                })

            if department.branch_id:
                if not branch:
                    raise serializers.ValidationError({
                        "department":
                            "Department requires a branch."
                    })
                if department.branch_id != branch.id:
                    raise serializers.ValidationError({
                        "department":
                            "Department does not belong "
                            "to selected branch."
                    })

        return attrs        