from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404


from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import EmailOTP
from .serializers import (
    LoginSerializer,
    SuperUserOTPSerializer,
    SuperUserRegisterSerializer,
    StaffCreateSerializer,
    StaffListSerializer,
    StaffDetailSerializer,
    PatientCreateSerializer,
    PatientRegisterSerializer,
    PatientVerifyOTPSerializer,
    PatientListSerializer,
    PatientDetailSerializer,
    HospitalAdminCreateSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    HospitalAdminUpdateSerializer
)
from .permissions import IsSuperUser, IsSuperUserOrHospitalAdmin
from .utils import send_otp


User = get_user_model()

STAFF_ROLES = [
    "DOCTOR",
    "NURSE",
    "LAB_TECHNICIAN",
    "PHARMACIST",
    "ACCOUNTANT",
    "RECEPTIONIST",
]

UPLOAD_PARSERS = [MultiPartParser, FormParser, JSONParser]


def api_error(message, code=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"success": False, "message": message},
        status=code,
    )


def get_scoped_staff(request, staff_id):
    queryset = User.objects.filter(
        pk=staff_id,
        role__in=STAFF_ROLES,
    ).select_related("hospital", "branch", "department")

    if request.user.role == "HOSPITAL_ADMIN":
        if not request.user.hospital_id:
            return queryset.none()
        queryset = queryset.filter(
            hospital_id=request.user.hospital_id
        )

    return queryset


def get_scoped_patient(request, patient_id):
    queryset = User.objects.filter(
        pk=patient_id,
        role="PATIENT",
    ).select_related("hospital", "branch", "department")

    if request.user.role == "HOSPITAL_ADMIN":
        if not request.user.hospital_id:
            return queryset.none()
        queryset = queryset.filter(
            hospital_id=request.user.hospital_id
        )

    return queryset


# =========================================================
# LOGIN
# =========================================================

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


# =========================================================
# SUPER USER REGISTRATION OTP
# =========================================================

class SuperUserRequestOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SuperUserOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip().lower()

        send_otp(email=email, purpose="SUPERUSER_REGISTER")

        return Response(
            {
                "success": True,
                "message": "OTP sent successfully to your email.",
            },
            status=status.HTTP_200_OK,
        )


class SuperUserRegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = UPLOAD_PARSERS

    def post(self, request):
        serializer = SuperUserRegisterSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Super User registered successfully.",
                "data": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "profile_image": (
                        request.build_absolute_uri(user.profile_image.url)
                        if user.profile_image else None
                    ),
                },
            },
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# STAFF CREATE / LIST / DETAIL / DELETE
# =========================================================

class StaffCreateView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUserOrHospitalAdmin]
    parser_classes = UPLOAD_PARSERS

    def post(self, request):
        serializer = StaffCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        staff = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Staff created successfully.",
                "data": StaffListSerializer(
                    staff,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class StaffListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUserOrHospitalAdmin]

    def get(self, request):
        queryset = User.objects.filter(
            role__in=STAFF_ROLES,
        ).select_related(
            "hospital", "branch", "department",
        ).order_by("-date_joined")

        if request.user.role == "HOSPITAL_ADMIN":
            if not request.user.hospital_id:
                return api_error(
                    "You are not assigned to a hospital.",
                    status.HTTP_403_FORBIDDEN,
                )
            queryset = queryset.filter(
                hospital_id=request.user.hospital_id
            )

        role = request.query_params.get("role")
        if role:
            if role not in STAFF_ROLES:
                return api_error("Invalid staff role.")
            queryset = queryset.filter(role=role)

        for field in ("branch_id", "department_id"):
            value = request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})

        active = request.query_params.get("is_active")
        if active is not None:
            if active.lower() not in ("true", "false"):
                return api_error("is_active must be true or false.")
            queryset = queryset.filter(
                is_active=(active.lower() == "true")
            )

        data = StaffListSerializer(
            queryset,
            many=True,
            context={"request": request},
        ).data

        return Response(
            {"success": True, "count": len(data), "data": data},
            status=status.HTTP_200_OK,
        )


class StaffDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUserOrHospitalAdmin]
    parser_classes = UPLOAD_PARSERS

    def get(self, request, staff_id):
        staff = get_scoped_staff(request, staff_id).first()
        if not staff:
            return api_error("Staff not found.", status.HTTP_404_NOT_FOUND)

        serializer = StaffDetailSerializer(
            staff,
            context={"request": request},
        )
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def patch(self, request, staff_id):
        staff = get_scoped_staff(request, staff_id).first()
        if not staff:
            return api_error("Staff not found.", status.HTTP_404_NOT_FOUND)

        serializer = StaffDetailSerializer(
            staff,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        staff = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Staff updated successfully.",
                "data": StaffDetailSerializer(
                    staff,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, staff_id):
        staff = get_scoped_staff(request, staff_id).first()
        if not staff:
            return api_error("Staff not found.", status.HTTP_404_NOT_FOUND)

        if staff.is_superuser or staff.pk == request.user.pk:
            return api_error(
                "You cannot delete this account.",
                status.HTTP_403_FORBIDDEN,
            )

        staff.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaffStatusView(APIView):
    # Only a real Super User can activate/deactivate staff.
    permission_classes = [IsAuthenticated, IsSuperUser]

    def patch(self, request, staff_id):
        is_active = request.data.get("is_active")
        if not isinstance(is_active, bool):
            return api_error("is_active must be true or false.")

        staff = User.objects.filter(
            pk=staff_id,
            role__in=STAFF_ROLES,
        ).first()

        if not staff:
            return api_error("Staff not found.", status.HTTP_404_NOT_FOUND)

        staff.is_active = is_active
        staff.save(update_fields=["is_active"])

        return Response(
            {
                "success": True,
                "message": "Staff status updated successfully.",
                "data": {"id": staff.id, "is_active": staff.is_active},
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# PATIENT SELF-REGISTRATION / OTP
# =========================================================

class PatientRegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = UPLOAD_PARSERS

    def post(self, request):
        serializer = PatientRegisterSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
     
        patient = serializer.save()
        send_otp(email=patient.email, purpose="PATIENT_REGISTER")

        return Response(
            {
                "success": True,
                "message": "Registration successful. OTP sent to your email.",
                "user_id": patient.id,
                "email": patient.email,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyPatientOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PatientVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        patient = serializer.validated_data["user"]
        otp_obj = (
            serializer.validated_data.get("otp_obj")
            or serializer.validated_data.get("otp_record")
        )

        if otp_obj is None:
            return api_error(
                "OTP record was not returned by the serializer."
            )

        with transaction.atomic():
            patient.is_email_verified = True
            patient.save(update_fields=["is_email_verified"])

            otp_obj.is_verified = True
            otp_obj.save(update_fields=["is_verified"])

        return Response(
            {
                "success": True,
                "message": "Patient email verified successfully.",
                "data": {
                    "user_id": patient.id,
                    "email": patient.email,
                    "is_email_verified": True,
                },
            },
            status=status.HTTP_200_OK,
        )


class ResendPatientOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "")
        if not isinstance(email, str) or not email.strip():
            return api_error("Email is required.")

        email = email.strip().lower()
        patient = User.objects.filter(
            email__iexact=email,
            role="PATIENT",
        ).first()
        if not patient or patient.is_email_verified:
            return Response(
                {
                    "success": True,
                    "message": "If the account requires verification, an OTP will be sent.",
                },
                status=status.HTTP_200_OK,
            )

        send_otp(email=patient.email, purpose="PATIENT_REGISTER")
        return Response(
            {
                "success": True,
                "message": "If the account requires verification, an OTP will be sent.",
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# PATIENT CREATE / LIST / DETAIL / DELETE
# =========================================================

class PatientCreateView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUserOrHospitalAdmin]
    parser_classes = UPLOAD_PARSERS

    def post(self, request):
        serializer = PatientCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        patient = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Patient created successfully.",
                "data": PatientListSerializer(
                    patient,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class PatientListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUserOrHospitalAdmin]

    def get(self, request):
        queryset = User.objects.filter(
            role="PATIENT",
        ).select_related(
            "hospital", "branch", "department",
        ).order_by("-date_joined")

        if request.user.role == "HOSPITAL_ADMIN":
            if not request.user.hospital_id:
                return api_error(
                    "You are not assigned to a hospital.",
                    status.HTTP_403_FORBIDDEN,
                )
            queryset = queryset.filter(
                hospital_id=request.user.hospital_id
            )
       
        for field in ("hospital_id", "branch_id", "department_id"):
            value = request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})

        active = request.query_params.get("is_active")
        if active is not None:
            if active.lower() not in ("true", "false"):
                return api_error("is_active must be true or false.")
            queryset = queryset.filter(
                is_active=(active.lower() == "true")
            )

        data = PatientListSerializer(
            queryset,
            many=True,
            context={"request": request},
        ).data

        return Response(
            {"success": True, "count": len(data), "data": data},
            status=status.HTTP_200_OK,
        )


class PatientDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUserOrHospitalAdmin]
    parser_classes = UPLOAD_PARSERS

    def get(self, request, patient_id):
        patient = get_scoped_patient(request, patient_id).first()
        if not patient:
            return api_error("Patient not found.", status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "success": True,
                "data": PatientDetailSerializer(
                    patient,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, patient_id):
        patient = get_scoped_patient(request, patient_id).first()
        if not patient:
            return api_error("Patient not found.", status.HTTP_404_NOT_FOUND)

        serializer = PatientDetailSerializer(
            patient,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        patient = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Patient updated successfully.",
                "data": PatientDetailSerializer(
                    patient,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, patient_id):
        patient = get_scoped_patient(request, patient_id).first()
        if not patient:
            return api_error("Patient not found.", status.HTTP_404_NOT_FOUND)

        patient.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PatientStatusView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]

    def patch(self, request, patient_id):
        is_active = request.data.get("is_active")
        if not isinstance(is_active, bool):
            return api_error("is_active must be true or false.")

        patient = User.objects.filter(
            pk=patient_id,
            role="PATIENT",
        ).first()

        if not patient:
            return api_error("Patient not found.", status.HTTP_404_NOT_FOUND)

        patient.is_active = is_active
        patient.save(update_fields=["is_active"])

        return Response(
            {
                "success": True,
                "message": "Patient status updated successfully.",
                "data": {"id": patient.id, "is_active": patient.is_active},
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# CURRENT USER
# =========================================================

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        def image_url(field):
            if not field:
                return None
            return request.build_absolute_uri(field.url)

        return Response(
            {
                "success": True,
                "data": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "phone": user.phone,
                    "role": user.role,
                    "role_name": user.get_role_display(),
                    "hospital_id": user.hospital_id,
                    "hospital_name": (
                        user.hospital.name if user.hospital_id else None
                    ),
                    "branch_id": user.branch_id,
                    "branch_name": (
                        user.branch.name if user.branch_id else None
                    ),
                    "department_id": user.department_id,
                    "department_name": (
                        user.department.name if user.department_id else None
                    ),
                    "profile_image": image_url(user.profile_image),
                    "is_email_verified": user.is_email_verified,
                    "is_approved": user.is_approved,
                    "is_active": user.is_active,
                },
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# HOSPITAL ADMIN CREATE / LIST / OTP / APPROVAL
# =========================================================

class CreateHospitalAdminView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]
    parser_classes = UPLOAD_PARSERS

    def post(self, request):
        serializer = HospitalAdminCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        admin = serializer.save()

        send_otp(email=admin.email, purpose="HOSPITAL_ADMIN")

        return Response(
            {
                "success": True,
                "message": "Hospital Admin created. OTP sent to the admin email.",
                "data": {
                    "id": admin.id,
                    "username": admin.username,
                    "email": admin.email,
                    "role": admin.role,
                    "hospital_id": admin.hospital_id,
                    "branch_id": admin.branch_id,
                    "profile_image": (
                        request.build_absolute_uri(admin.profile_image.url)
                        if admin.profile_image else None
                    ),
                    "is_email_verified": admin.is_email_verified,
                    "is_approved": admin.is_approved,
                    "is_active": admin.is_active,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class HospitalAdminListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]

    def get(self, request):
        admins = User.objects.filter(
            role="HOSPITAL_ADMIN",
        ).select_related(
            "hospital", "branch",
        ).order_by("-date_joined")

        data = []
        for admin in admins:
            data.append({
                "id": admin.id,
                "username": admin.username,
                "email": admin.email,
                "first_name": admin.first_name,
                "last_name": admin.last_name,
                "full_name": admin.get_full_name(),
                "phone": admin.phone,
                "role": admin.role,
                "role_name": admin.get_role_display(),
                "hospital_id": admin.hospital_id,
                "hospital_name": (
                    admin.hospital.name if admin.hospital_id else None
                ),
                "branch_id": admin.branch_id,
                "branch_name": (
                    admin.branch.name if admin.branch_id else None
                ),
                "profile_image": (
                    request.build_absolute_uri(admin.profile_image.url)
                    if admin.profile_image else None
                ),
                "is_active": admin.is_active,
                "is_approved": admin.is_approved,
                "is_email_verified": admin.is_email_verified,
                "date_joined": admin.date_joined,
            })

        return Response(
            {"success": True, "count": len(data), "data": data},
            status=status.HTTP_200_OK,
        )


class ResendHospitalAdminOTPView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]

    def post(self, request, admin_id):
        admin = User.objects.filter(
            pk=admin_id,
            role="HOSPITAL_ADMIN",
        ).first()

        if not admin:
            return api_error(
                "Hospital Admin not found.",
                status.HTTP_404_NOT_FOUND,
            )

        if admin.is_email_verified:
            return api_error("Hospital Admin email is already verified.")

        send_otp(email=admin.email, purpose="HOSPITAL_ADMIN")
        return Response(
            {"success": True, "message": "A new OTP has been sent."},
            status=status.HTTP_200_OK,
        )


class VerifyHospitalAdminOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "")
        otp = str(request.data.get("otp", "")).strip()

        if not isinstance(email, str) or not email.strip() or not otp:
            return api_error("Email and OTP are required.")

        email = email.strip().lower()
        admin = User.objects.filter(
            email__iexact=email,
            role="HOSPITAL_ADMIN",
        ).first()

        if not admin:
            return api_error(
                "Invalid email or OTP.",
                status.HTTP_400_BAD_REQUEST,
            )

        otp_record = EmailOTP.objects.filter(
            email__iexact=admin.email,
            purpose="HOSPITAL_ADMIN",
            is_verified=False,
        ).order_by("-created_at").first()

        if not otp_record:
            return api_error("OTP not found or already verified.")

        if otp_record.expires_at <= timezone.now():
            return api_error("OTP has expired.")

        if otp_record.attempts >= 5:
            return api_error("Maximum OTP attempts exceeded. Request a new OTP.")

        if not check_password(otp, otp_record.otp_hash):
            otp_record.attempts += 1
            otp_record.save(update_fields=["attempts"])
            return api_error("Invalid email or OTP.")

        with transaction.atomic():
            otp_record.is_verified = True
            otp_record.save(update_fields=["is_verified"])

            admin.is_email_verified = True
            admin.is_approved = False
            admin.save(update_fields=["is_email_verified", "is_approved"])

        return Response(
            {
                "success": True,
                "message": "Email verified. Awaiting Super User approval.",
                "data": {
                    "email": admin.email,
                    "is_email_verified": True,
                    "is_approved": False,
                    "is_active": admin.is_active,
                    "login_allowed": False,
                },
            },
            status=status.HTTP_200_OK,
        )


class HospitalAdminApprovalView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]

    def patch(self, request, admin_id):
        admin = User.objects.filter(
            pk=admin_id,
            role="HOSPITAL_ADMIN",
        ).first()

        if not admin:
            return api_error(
                "Hospital Admin not found.",
                status.HTTP_404_NOT_FOUND,
            )

        if not admin.is_email_verified:
            return api_error(
                "Hospital Admin must verify email OTP before approval."
            )

        admin.is_approved = True
        admin.is_active = True
        admin.save(update_fields=["is_approved", "is_active"])

        return Response(
            {
                "success": True,
                "message": "Hospital Admin approved successfully.",
                "data": {
                    "id": admin.id,
                    "email": admin.email,
                    "is_email_verified": admin.is_email_verified,
                    "is_approved": admin.is_approved,
                    "is_active": admin.is_active,
                    "login_allowed": True,
                },
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# LOGOUT
# =========================================================

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return api_error("Refresh token is required.")

        try:
            RefreshToken(refresh_token).blacklist()
        except Exception:
            return api_error("Invalid or expired refresh token.")

        return Response(
            {"success": True, "message": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


# =========================================================
# FORGOT / RESET PASSWORD
# =========================================================

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()

        user_exists = User.objects.filter(email__iexact=email).exists()
        if user_exists:
            send_otp(email=email, purpose="FORGOT_PASSWORD")
        return Response(
            {
                "success": True,
                "message": "If an account exists for this email, a password reset OTP will be sent.",
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "success": True,
                "message": "Password reset successfully. You can log in with your new password.",
            },
            status=status.HTTP_200_OK,
        )




# hospital admin edit delete logic    



class HospitalAdminDetailView(APIView):
    """
    Super User can retrieve and edit a Hospital Admin.
    """

    permission_classes = [IsAuthenticated]

    def get_admin(self, admin_id):
        return get_object_or_404(
            User,
            pk=admin_id,
            role="HOSPITAL_ADMIN",
        )

    def check_super_user(self, request):
        return (
            request.user.is_authenticated
            and request.user.is_active
            and request.user.is_superuser
            and request.user.role == "SUPER_USER"
        )

    def get(self, request, admin_id):
        if not self.check_super_user(request):
            return Response(
                {"detail": "Only Super User can manage Hospital Admins."},
                status=status.HTTP_403_FORBIDDEN,
            )

        admin = self.get_admin(admin_id)
        serializer = HospitalAdminUpdateSerializer(
            admin,
            context={"request": request},
        )
        return Response(serializer.data)

    def patch(self, request, admin_id):
        if not self.check_super_user(request):
            return Response(
                {"detail": "Only Super User can edit Hospital Admins."},
                status=status.HTTP_403_FORBIDDEN,
            )

        admin = self.get_admin(admin_id)
        serializer = HospitalAdminUpdateSerializer(
            admin,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            "message": "Hospital Admin updated successfully.",
            "admin": serializer.data,
        })

    def put(self, request, admin_id):
        if not self.check_super_user(request):
            return Response(
                {"detail": "Only Super User can edit Hospital Admins."},
                status=status.HTTP_403_FORBIDDEN,
            )

        admin = self.get_admin(admin_id)
        serializer = HospitalAdminUpdateSerializer(
            admin,
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            "message": "Hospital Admin updated successfully.",
            "admin": serializer.data,
        })


class HospitalAdminStatusView(APIView):
    """
    Super User can activate or deactivate a Hospital Admin.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, admin_id):
        actor = request.user

        if not (
            actor.is_active
            and actor.is_superuser
            and actor.role == "SUPER_USER"
        ):
            return Response(
                {"detail": "Only Super User can change account status."},
                status=status.HTTP_403_FORBIDDEN,
            )

        admin = get_object_or_404(
            User,
            pk=admin_id,
            role="HOSPITAL_ADMIN",
        )

        is_active = request.data.get("is_active")

        if not isinstance(is_active, bool):
            return Response(
                {"is_active": "Send true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if is_active and (
            not admin.is_approved or not admin.is_email_verified
        ):
            return Response(
                {
                    "detail": (
                        "This admin must verify email and receive "
                        "approval before activation."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin.is_active = is_active
        admin.save(update_fields=["is_active"])

        return Response({
            "message": (
                "Hospital Admin activated successfully."
                if is_active
                else "Hospital Admin deactivated successfully."
            ),
            "id": admin.id,
            "is_active": admin.is_active,
        })


class HospitalAdminDeleteView(APIView):
    """
    Permanently deletes a Hospital Admin account.
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request, admin_id):
        actor = request.user

        if not (
            actor.is_active
            and actor.is_superuser
            and actor.role == "SUPER_USER"
        ):
            return Response(
                {"detail": "Only Super User can delete Hospital Admins."},
                status=status.HTTP_403_FORBIDDEN,
            )

        admin = get_object_or_404(
            User,
            pk=admin_id,
            role="HOSPITAL_ADMIN",
        )

        admin_id = admin.pk
        admin.delete()

        return Response(
            {
                "message": "Hospital Admin deleted successfully.",
                "id": admin_id,
            },
            status=status.HTTP_200_OK,
        )
    