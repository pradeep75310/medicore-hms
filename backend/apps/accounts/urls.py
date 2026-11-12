from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # Authentication
    LoginView,
    LogoutView,

    # Super User
    SuperUserRequestOTPView,
    SuperUserRegisterView,

    # Staff
    StaffCreateView,
    StaffListView,
    StaffDetailView,
    StaffStatusView,

    # Patient
    PatientRegisterView,
    VerifyPatientOTPView,
    ResendPatientOTPView,
    PatientCreateView,
    PatientListView,
    PatientDetailView,
    PatientStatusView,

    # Current User
    MeView,

    # Hospital Admin
    CreateHospitalAdminView,
    HospitalAdminListView,
    VerifyHospitalAdminOTPView,
    ResendHospitalAdminOTPView,
    HospitalAdminApprovalView,
    HospitalAdminDetailView,
    HospitalAdminStatusView,
    HospitalAdminDeleteView,

    # Password
    ForgotPasswordView,
    ResetPasswordView,
)


urlpatterns = [

    # =====================================================
    # AUTHENTICATION
    # =====================================================

    path(
        "login/",
        LoginView.as_view(),
        name="login",
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),


    # =====================================================
    # SUPER USER
    # =====================================================

    path(
        "superuser/request-otp/",
        SuperUserRequestOTPView.as_view(),
        name="superuser_request_otp",
    ),

    path(
        "superuser/register/",
        SuperUserRegisterView.as_view(),
        name="superuser_register",
    ),


    # =====================================================
    # PATIENT
    # =====================================================

    # Public patient self-registration with OTP
    path(
        "patient/register/",
        PatientRegisterView.as_view(),
        name="patient_register",
    ),

    path(
        "patient/verify-otp/",
        VerifyPatientOTPView.as_view(),
        name="patient_verify_otp",
    ),

    path(
        "patient/resend-otp/",
        ResendPatientOTPView.as_view(),
        name="patient_resend_otp",
    ),

    # Patient management by Super User / Hospital Admin
    path(
        "patients/create/",
        PatientCreateView.as_view(),
        name="patient_create",
    ),

    path(
        "patients/",
        PatientListView.as_view(),
        name="patient_list",
    ),

    path(
        "patients/<int:patient_id>/",
        PatientDetailView.as_view(),
        name="patient_detail",
    ),

    path(
        "patients/<int:patient_id>/status/",
        PatientStatusView.as_view(),
        name="patient_status",
    ),


    # =====================================================
    # CURRENT USER
    # =====================================================

    path(
        "me/",
        MeView.as_view(),
        name="me",
    ),


    # =====================================================
    # STAFF
    # =====================================================

    path(
        "staff/create/",
        StaffCreateView.as_view(),
        name="create_staff",
    ),

    path(
        "staff/",
        StaffListView.as_view(),
        name="staff_list",
    ),

    path(
        "staff/<int:staff_id>/",
        StaffDetailView.as_view(),
        name="staff_detail",
    ),

    path(
        "staff/<int:staff_id>/status/",
        StaffStatusView.as_view(),
        name="staff_status",
    ),


    # =====================================================
    # HOSPITAL ADMIN
    # =====================================================

    path(
        "hospital-admin/create/",
        CreateHospitalAdminView.as_view(),
        name="create_hospital_admin",
    ),

    path(
        "hospital-admins/",
        HospitalAdminListView.as_view(),
        name="hospital_admin_list",
    ),

    path(
        "hospital-admin/verify-otp/",
        VerifyHospitalAdminOTPView.as_view(),
        name="verify_hospital_admin_otp",
    ),

    path(
        "hospital-admin/<int:admin_id>/resend-otp/",
        ResendHospitalAdminOTPView.as_view(),
        name="resend_hospital_admin_otp",
    ),

    path(
        "hospital-admin/<int:admin_id>/approve/",
        HospitalAdminApprovalView.as_view(),
        name="hospital_admin_approve",
    ),
    
    # Hospital Admin management by Super User
    path(
        "hospital-admin/<int:admin_id>/",
        HospitalAdminDetailView.as_view(),
        name="hospital_admin_detail",
    ),
    path(
        "hospital-admin/<int:admin_id>/status/",
        HospitalAdminStatusView.as_view(),
        name="hospital_admin_status",
    ),
    path(
        "hospital-admin/<int:admin_id>/delete/",
        HospitalAdminDeleteView.as_view(),
        name="hospital_admin_delete",
    ),


    # =====================================================
    # PASSWORD MANAGEMENT
    # =====================================================

    path(
        "forgot-password/",
        ForgotPasswordView.as_view(),
        name="forgot_password",
    ),

    path(
        "reset-password/",
        ResetPasswordView.as_view(),
        name="reset_password",
    ),

]
