from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from .models import EmailOTP, User
from .serializers import (
    LoginSerializer,
    SuperUserOTPSerializer,
    SuperUserRegisterSerializer,
    StaffCreateSerializer,
    PatientRegisterSerializer,
    HospitalAdminCreateSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    StaffListSerializer,
    StaffDetailSerializer,  
)
from .permissions import (
    IsSuperUser,
    IsSuperUserOrHospitalAdmin,
)
from .utils import send_otp




ser = get_user_model()


# =========================================================
# STAFF ROLES
# =========================================================

STAFF_ROLES = [
    "DOCTOR",
    "NURSE",
    "LAB_TECHNICIAN",
    "PHARMACIST",
    "ACCOUNTANT",
    "RECEPTIONIST",
]



class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    

class SuperUserRequestOTPView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = SuperUserOTPSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        email = serializer.validated_data["email"]
        send_otp(
            email=email,
            purpose="SUPERUSER_REGISTER"
        )
        return Response(
            {
                "success": True,
                "message":
                    "OTP sent successfully to your email."
            },
            status=status.HTTP_200_OK
        )


class SuperUserRegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = SuperUserRegisterSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        user = serializer.save()
        return Response(
            {
                "success": True,
                "message":
                    "Super User registered successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                }
            },
            status=status.HTTP_201_CREATED
        )


class StaffCreateView(APIView):
    permission_classes = [
        IsAuthenticated
    ]
    def post(self, request):
        # Only Super User or Hospital Admin
        if not (
            request.user.is_superuser
            or request.user.role == "HOSPITAL_ADMIN"
        ):
            return Response(
                {
                    "success": False,
                    "message":
                        "You do not have permission "
                        "to create staff."
                },
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = StaffCreateSerializer(
            data=request.data,
            context={
                "request": request
            }
        )
        serializer.is_valid(
            raise_exception=True
        )
        user = serializer.save()
        return Response(
            {
                "success": True,
                "message":
                    "Staff created successfully.",
                "data": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "role_name":
                        user.get_role_display(),
                    "hospital_id":
                        user.hospital_id,
                    "branch_id":
                        user.branch_id,
                    "department_id":
                        user.department_id,
                    "is_active":
                        user.is_active,
                    "is_approved":
                        user.is_approved,
                }
            },
            status=status.HTTP_201_CREATED
        )




class PatientRegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = PatientRegisterSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        user = serializer.save()
        return Response(
            {
                "success": True,
                "message":
                    "Patient registered successfully. "
                    "Please verify your email.",
                "user_id": user.id
            },
            status=status.HTTP_201_CREATED
        )

class MeView(APIView):
    permission_classes = [
        IsAuthenticated
    ]
    def get(self, request):
        user = request.user
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
                    # Role
                    "role": user.role,
                    "role_name":
                        user.get_role_display(),
                    # Hospital
                    "hospital_id": (
                        user.hospital.id
                        if user.hospital
                        else None
                    ),
                    "hospital_name": (
                        user.hospital.name
                        if user.hospital
                        else None
                    ),
                    # Branch
                    "branch_id": (
                        user.branch.id
                        if user.branch
                        else None
                    ),
                    "branch_name": (
                        user.branch.name
                        if user.branch
                        else None
                    ),
                    # Department
                    "department_id": (
                        user.department.id
                        if user.department
                        else None
                    ),
                    "department_name": (
                        user.department.name
                        if user.department
                        else None
                    ),
                    # Account status
                    "is_email_verified":
                        user.is_email_verified,
                    "is_approved":
                        user.is_approved,
                    "is_active":
                        user.is_active,
                }
            }
        )
        
class CreateHospitalAdminView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsSuperUser
    ]
    def post(self, request):
        serializer = HospitalAdminCreateSerializer(
            data=request.data,
            context={
                "request": request
            }
        )
        serializer.is_valid(
            raise_exception=True
        )
        user = serializer.save()
        # ==========================================
        # SEND OTP
        # ==========================================

        send_otp(
            email=user.email,
            purpose="HOSPITAL_ADMIN"
        )
        return Response(
            {
                "success": True,

                "message":
                    "Hospital Admin created successfully. "
                    "OTP has been sent to the admin email.",

                "admin": {

                    "id":
                        user.id,

                    "username":
                        user.username,

                    "email":
                        user.email,

                    "role":
                        user.role,

                    "hospital_id": (

                        user.hospital.id
                        if user.hospital
                        else None
                    ),

                    "branch_id": (

                        user.branch.id
                        if user.branch
                        else None
                    ),

                    "is_email_verified":
                        user.is_email_verified,

                    "is_active":
                        user.is_active,
                        
                     "is_approved":
                        user.is_approved,    
                }
            },

            status=status.HTTP_201_CREATED
        ) 
        
class StaffListView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsSuperUserOrHospitalAdmin
    ]
    def get(self, request):
        if request.user.is_superuser:
            users = User.objects.exclude(
                role="SUPER_USER"
            ).select_related(
                "hospital",
                "branch"
            )
        else:
            users = User.objects.filter(
                hospital=request.user.hospital
            ).exclude(
                role="SUPER_USER"
            ).select_related(
                "hospital",
                "branch"
            )
        data = []

        for user in users:

            data.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "role": user.role,
                "role_name": user.get_role_display(),
                "hospital_id": (
                    user.hospital.id
                    if user.hospital
                    else None
                ),
                "branch_id": (
                    user.branch.id
                    if user.branch
                    else None
                ),
                "is_active": user.is_active,
                "is_approved": user.is_approved,
            })

        return Response({
            "success": True,
            "count": len(data),
            "data": data
        })                

class LogoutView(APIView):
    permission_classes = [
        IsAuthenticated
    ]
    def post(self, request):
        refresh_token = request.data.get(
            "refresh"
        )
        if not refresh_token:
            return Response(
                {
                    "success": False,
                    "message":
                        "Refresh token is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(
                refresh_token
            )
            token.blacklist()
            return Response({
                "success": True,
                "message":
                    "Logged out successfully."
            })
        except Exception:
            return Response(
                {
                    "success": False,
                    "message":
                        "Invalid or expired refresh token."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
            
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = ForgotPasswordSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        email = serializer.validated_data[
            "email"
        ]
        send_otp(
            email=email,
            purpose="FORGOT_PASSWORD"
        )
        return Response({
            "success": True,
            "message":
                "Password reset OTP sent to your email."
        })        
        
        

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = ResetPasswordSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        serializer.save()
        return Response({
            "success": True,
            "message":
                "Password reset successfully. "
                "You can login with your new password."
        })                    


class StaffListView(APIView):
    permission_classes = [
        IsAuthenticated
    ]
    def get(self, request):
        user = request.user

        # -------------------------------------------------
        # PERMISSION CHECK
        # -------------------------------------------------

        if not (
            user.is_superuser
            or user.role == "HOSPITAL_ADMIN"
        ):
            return Response(
                {
                    "success": False,
                    "message":
                        "You do not have permission "
                        "to view staff."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # BASE QUERY
        # -------------------------------------------------

        queryset = User.objects.filter(
            role__in=STAFF_ROLES
        ).select_related(
            "hospital",
            "branch",
            "department",
        ).order_by(
            "-date_joined"
        )

        # -------------------------------------------------
        # HOSPITAL ADMIN
        # ONLY OWN HOSPITAL STAFF
        # -------------------------------------------------

        if user.role == "HOSPITAL_ADMIN":
            if not user.hospital_id:
                return Response(
                    {
                        "success": False,
                        "message":
                            "You are not assigned "
                            "to any hospital."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            queryset = queryset.filter(
                hospital_id=user.hospital_id
            )

        # -------------------------------------------------
        # OPTIONAL FILTERS
        # -------------------------------------------------

        role = request.query_params.get(
            "role"
        )

        is_active = request.query_params.get(
            "is_active"
        )

        branch_id = request.query_params.get(
            "branch_id"
        )

        department_id = request.query_params.get(
            "department_id"
        )

        # Filter by role

        if role:
            if role not in STAFF_ROLES:
                return Response(
                    {
                        "success": False,
                        "message":
                            "Invalid staff role."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            queryset = queryset.filter(
                role=role
            )

        # Filter by active status

        if is_active is not None:
            if is_active.lower() not in [
                "true",
                "false"
            ]:
                return Response(
                    {
                        "success": False,
                        "message":
                            "is_active must be true "
                            "or false."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            queryset = queryset.filter(
                is_active=(
                    is_active.lower() == "true"
                )
            )

        # Filter by branch
        if branch_id:
            queryset = queryset.filter(
                branch_id=branch_id
            )
        # Filter by department
        if department_id:
            queryset = queryset.filter(
                department_id=department_id
            )

        # -------------------------------------------------
        # SERIALIZER
        # -------------------------------------------------

        serializer = StaffListSerializer(
            queryset,
            many=True
        )

        return Response(
            {
                "success": True,
                "count": queryset.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK
        )

# =========================================================
# STAFF DETAIL + UPDATE VIEW
# =========================================================

class StaffDetailView(APIView):
    permission_classes = [
        IsAuthenticated
    ]
    # -----------------------------------------------------
    # GET STAFF OBJECT
    # -----------------------------------------------------
    def get_staff(
        self,
        request,
        staff_id
    ):
        user = request.user

        queryset = User.objects.filter(
            id=staff_id,
            role__in=STAFF_ROLES
        ).select_related(
            "hospital",
            "branch",
            "department",
        )
        # -------------------------------------------------
        # HOSPITAL ADMIN
        # ONLY OWN HOSPITAL
        # -------------------------------------------------
        if user.role == "HOSPITAL_ADMIN":
            queryset = queryset.filter(
                hospital_id=user.hospital_id
            )
        return queryset.first()

    # -----------------------------------------------------
    # GET
    # -----------------------------------------------------

    def get(
        self,
        request,
        staff_id
    ):
        user = request.user
        # Permission
        if not (
            user.is_superuser
            or user.role == "HOSPITAL_ADMIN"
        ):
            return Response(
                {
                    "success": False,
                    "message":
                        "You do not have permission "
                        "to view staff."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        staff = self.get_staff(
            request,
            staff_id
        )

        if not staff:
            return Response(
                {
                    "success": False,
                    "message":
                        "Staff not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = StaffDetailSerializer(
            staff
        )
        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK
        )

    # -----------------------------------------------------
    # PATCH
    # -----------------------------------------------------

    def patch(
        self,
        request,
        staff_id
    ):

        user = request.user
        # Permission
        if not (
            user.is_superuser
            or user.role == "HOSPITAL_ADMIN"
        ):

            return Response(
                {
                    "success": False,
                    "message":
                        "You do not have permission "
                        "to update staff."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Get staff

        staff = self.get_staff(
            request,
            staff_id
        )

        if not staff:

            return Response(
                {
                    "success": False,
                    "message":
                        "Staff not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -------------------------------------------------
        # SERIALIZER
        # -------------------------------------------------

        serializer = StaffDetailSerializer(
            staff,
            data=request.data,
            partial=True,
            context={
                "request": request
            }
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "success": True,
                "message":
                    "Staff updated successfully.",
                "data":
                    serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# STAFF ACTIVATE / DEACTIVATE
# =========================================================

class StaffStatusView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def patch(
        self,
        request,
        staff_id
    ):

        user = request.user

        # -------------------------------------------------
        # PERMISSION CHECK
        # -------------------------------------------------

        if not (
            user.is_superuser
            or user.role == "HOSPITAL_ADMIN"
        ):

            return Response(
                {
                    "success": False,
                    "message":
                        "You do not have permission "
                        "to change staff status."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # GET STAFF
        # -------------------------------------------------

        queryset = User.objects.filter(
            id=staff_id,
            role__in=STAFF_ROLES
        )

        # -------------------------------------------------
        # HOSPITAL ADMIN
        # ONLY OWN HOSPITAL
        # -------------------------------------------------

        if user.role == "HOSPITAL_ADMIN":

            if not user.hospital_id:

                return Response(
                    {
                        "success": False,
                        "message":
                            "You are not assigned "
                            "to any hospital."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            queryset = queryset.filter(
                hospital_id=user.hospital_id
            )

        staff = queryset.first()

        # -------------------------------------------------
        # STAFF NOT FOUND
        # -------------------------------------------------

        if not staff:

            return Response(
                {
                    "success": False,
                    "message":
                        "Staff not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -------------------------------------------------
        # GET STATUS
        # -------------------------------------------------

        is_active = request.data.get(
            "is_active"
        )

        # -------------------------------------------------
        # VALIDATE STATUS
        # -------------------------------------------------

        if not isinstance(
            is_active,
            bool
        ):

            return Response(
                {
                    "success": False,
                    "message":
                        "is_active must be true or false."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # UPDATE STATUS
        # -------------------------------------------------

        staff.is_active = is_active

        staff.save(
            update_fields=[
                "is_active"
            ]
        )

        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        return Response(
            {
                "success": True,
                "message": (
                    "Staff activated successfully."
                    if is_active
                    else
                    "Staff deactivated successfully."
                ),
                "data": {
                    "id": staff.id,
                    "username": staff.username,
                    "email": staff.email,
                    "role": staff.role,
                    "role_name":
                        staff.get_role_display(),
                    "is_active":
                        staff.is_active,
                }
            },
            status=status.HTTP_200_OK
        )



class HospitalAdminListView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        # Only Super User
        if not request.user.is_superuser:

            raise PermissionDenied(
                "Only Super User can view Hospital Admins."
            )

        admins = User.objects.filter(
            role="HOSPITAL_ADMIN"
        ).select_related(
            "hospital",
            "branch"
        ).order_by(
            "-created_at"
        )

        data = []

        for admin in admins:

            data.append({

                "id": admin.id,

                "username": admin.username,

                "email": admin.email,

                "first_name": admin.first_name,

                "last_name": admin.last_name,

                "full_name":
                    admin.get_full_name(),

                "phone": admin.phone,

                "role": admin.role,

                "role_name":
                    admin.get_role_display(),

                "hospital_id":
                    admin.hospital.id
                    if admin.hospital
                    else None,

                "hospital_name":
                    admin.hospital.name
                    if admin.hospital
                    else None,

                "branch_id":
                    admin.branch.id
                    if admin.branch
                    else None,

                "branch_name":
                    admin.branch.name
                    if admin.branch
                    else None,

                "is_active":
                    admin.is_active,

                "is_approved":
                    admin.is_approved,

                "created_at":
                    admin.created_at,
                
                "is_email_verified":
                    admin.is_email_verified,    

            })

        return Response({

            "success": True,

            "count": len(data),

            "data": data

        })
        
        

class VerifyHospitalAdminOTPView(APIView):

    permission_classes = [
        AllowAny
    ]
    def post(self, request):

        email = request.data.get(
            "email" , " "
        )

        otp = request.data.get(
            "otp" , " "
        ).strip()

        if not email or not otp:

            return Response(
                {
                    "success": False,

                    "message":
                        "Email and OTP are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        email = email.strip().lower()


        try:

            user = User.objects.get(
                email__iexact=email,
                role="HOSPITAL_ADMIN"
            )

        except User.DoesNotExist:

            return Response(
                {
                    "success": False,

                    "message":
                        "Hospital Admin not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )


        otp_record = EmailOTP.objects.filter(

            email__iexact=user.email,

            purpose="HOSPITAL_ADMIN",

            is_verified=False

        ).order_by(
            "-created_at"
        ).first()


        if not otp_record:

            return Response(
                {
                    "success": False,

                    "message":
                        "OTP not found or already verified."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        if otp_record.expires_at < timezone.now():

            return Response(
                {
                    "success": False,

                    "message":
                        "OTP has expired."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        if not check_password(
            otp,
            otp_record.otp_hash
        ):

            otp_record.attempts += 1

            otp_record.save(
                update_fields=[
                    "attempts"
                ]
            )

            return Response(
                {
                    "success": False,

                    "message":
                        "Invalid OTP."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        # Mark OTP verified

        otp_record.is_verified = True

        otp_record.save(
            update_fields=[
                "is_verified"
            ]
        )


        # Email is verified
        # But Super User approval is still pending

        user.is_email_verified = True

        # user.is_active = False

        user.is_approved = False


        user.save(
            update_fields=[
                "is_email_verified",
                # "is_active",
                "is_approved"
            ]
        )


        return Response(

            {
                "success": True,

                "message": (
                    "Email verified successfully. "
                    "Your account is waiting for "
                    "Super User approval."
                ),

                "data": {

                    "email":
                        user.email,

                    "is_email_verified":
                        user.is_email_verified,

                    "is_approved":
                        user.is_approved,

                    "is_active":
                        user.is_active,
                        
                    "login_allowed": False    
                }
            },

            status=status.HTTP_200_OK
        )
        
        
        
class HospitalAdminApprovalView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsSuperUser
    ]
    def patch(
        self,
        request,
        admin_id
    ):

        try:

            admin = User.objects.get(

                id=admin_id,

                role="HOSPITAL_ADMIN"
            )

        except User.DoesNotExist:

            return Response(

                {
                    "success": False,

                    "message":
                        "Hospital Admin not found."
                },

                status=status.HTTP_404_NOT_FOUND
            )


        # Email must be verified first

        if not admin.is_email_verified:

            return Response(

                {
                    "success": False,

                    "message": (
                        "Hospital Admin has not "
                        "verified the email yet."
                    )
                },

                status=status.HTTP_400_BAD_REQUEST
            )


        # Approve admin

        admin.is_approved = True

        admin.is_active = True


        admin.save(

            update_fields=[
                "is_approved",
                "is_active"
            ]
        )


        return Response(

            {
                "success": True,

                "message":
                    "Hospital Admin approved successfully.",

                "data": {

                    "id":
                        admin.id,

                    "username":
                        admin.username,

                    "email":
                        admin.email,

                    "is_email_verified":
                        admin.is_email_verified,

                    "is_approved":
                        admin.is_approved,

                    "is_active":
                        admin.is_active,
                }
            },

            status=status.HTTP_200_OK
        )        
        
        
        
class HospitalAdminApprovalView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsSuperUser
    ]

    def patch(
        self,
        request,
        admin_id
    ):

        try:

            admin = User.objects.get(
                id=admin_id,
                role="HOSPITAL_ADMIN"
            )

        except User.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message":
                        "Hospital Admin not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # OTP verification mandatory
        if not admin.is_email_verified:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Hospital Admin must verify "
                        "email OTP before approval."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        admin.is_approved = True

        admin.save(
            update_fields=[
                "is_approved"
            ]
        )

        return Response(
            {
                "success": True,
                "message":
                    "Hospital Admin approved successfully.",

                "data": {
                    "id": admin.id,
                    "username": admin.username,
                    "email": admin.email,
                    "is_email_verified":
                        admin.is_email_verified,
                    "is_approved":
                        admin.is_approved,
                    "is_active":
                        admin.is_active,
                    "login_allowed": True
                }
            },
            status=status.HTTP_200_OK
        )        
        
        
        