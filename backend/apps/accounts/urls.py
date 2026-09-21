from django.urls import path

from rest_framework_simplejwt.views import (
    TokenRefreshView
)

from .views import (
    LoginView,
    SuperUserRequestOTPView,
    SuperUserRegisterView,
    StaffCreateView,
    PatientRegisterView,
    MeView,
    CreateHospitalAdminView,
    LogoutView,
    ForgotPasswordView,
    ResetPasswordView,
    StaffListView,
    StaffDetailView,
    StaffStatusView,
    HospitalAdminListView,
    VerifyHospitalAdminOTPView,
    HospitalAdminApprovalView,
)


urlpatterns = [

    # Login
    path(
        "login/",
        LoginView.as_view(),
        name="login"
    ),

    # Refresh JWT
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),

    # Super User Registration
    path(
        "superuser/request-otp/",
        SuperUserRequestOTPView.as_view(),
        name="superuser_request_otp"
    ),

    path(
        "superuser/register/",
        SuperUserRegisterView.as_view(),
        name="superuser_register"
    ),

    # Hospital Admin / Staff creation
    path(
        "staff/create/",
        StaffCreateView.as_view(),
        name="create_staff"
    ),

    # Patient self registration
    path(
        "patient/register/",
        PatientRegisterView.as_view(),
        name="patient_register"
    ),

    # Logged in user
    path(
        "me/",
        MeView.as_view(),
        name="me"
    ),
    
# Admin
    
     path(
         "hospital-admin/create/",
         CreateHospitalAdminView.as_view(),
        name="create_hospital_admin"
),
     

     path(
    "hospital-admins/",
    HospitalAdminListView.as_view(),
    name="hospital_admin_list"
),

     
     path(
    "logout/",
    LogoutView.as_view(),
    name="logout"
),
     path(
    "forgot-password/",
    ForgotPasswordView.as_view(),
    name="forgot_password"
),
     path(
    "reset-password/",
    ResetPasswordView.as_view(),
    name="reset_password"
),
     
    path(
        "staff/",
        StaffListView.as_view(),
        name="staff_list"
    ),

    # Staff detail/update
    path(
        "staff/<int:staff_id>/",
        StaffDetailView.as_view(),
        name="staff_detail"
    ),

    # Activate/deactivate
    path(
        "staff/<int:staff_id>/status/",
        StaffStatusView.as_view(),
        name="staff_status"
    ),   
    
    path(
    "hospital-admin/verify-otp/",
    VerifyHospitalAdminOTPView.as_view(),
    name="verify_hospital_admin_otp"
),
    path(
    "hospital-admin/<int:admin_id>/approve/",
    HospitalAdminApprovalView.as_view(),
    name="hospital_admin_approve"
),  

]