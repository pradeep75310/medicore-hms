from rest_framework.permissions import BasePermission


# =========================================================
# SUPER USER
# =========================================================

class IsSuperUser(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and user.is_active
            and user.is_superuser
            and user.role == "SUPER_USER"
        )


# =========================================================
# HOSPITAL ADMIN
# =========================================================

class IsHospitalAdmin(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and user.is_active
            and user.role == "HOSPITAL_ADMIN"
            and user.is_approved
            and user.hospital_id is not None
        )


# =========================================================
# SUPER USER OR HOSPITAL ADMIN
# =========================================================

class IsSuperUserOrHospitalAdmin(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated or not user.is_active:
            return False

        # Super User
        if (
            user.is_superuser
            and user.role == "SUPER_USER"
        ):
            return True

        # Hospital Admin
        return (
            user.role == "HOSPITAL_ADMIN"
            and user.is_approved
            and user.hospital_id is not None
        )



class IsHospitalAdminOrSuperUser(IsSuperUserOrHospitalAdmin):
    pass


# =========================================================
# PATIENT
# =========================================================

class IsPatient(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and user.is_active
            and user.role == "PATIENT"
        )


# =========================================================
# DOCTOR
# =========================================================

class IsDoctor(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and user.is_active
            and user.role == "DOCTOR"
        )


# =========================================================
# NURSE
# =========================================================

class IsNurse(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and user.is_active
            and user.role == "NURSE"
        )


# =========================================================
# RECEPTIONIST
# =========================================================

class IsReceptionist(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and user.is_active
            and user.role == "RECEPTIONIST"
        )


# =========================================================
# PHARMACIST
# =========================================================

class IsPharmacist(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and user.is_active
            and user.role == "PHARMACIST"
        )


# =========================================================
# ACCOUNTANT
# =========================================================

class IsAccountant(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and user.is_active
            and user.role == "ACCOUNTANT"
        )


# =========================================================
# LAB TECHNICIAN
# =========================================================

class IsLabTechnician(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and user.is_active
            and user.role == "LAB_TECHNICIAN"
        )