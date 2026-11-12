from rest_framework.permissions import BasePermission


class IsSuperUserOrHospitalAdmin(BasePermission):

    def has_permission(self, request, view):

        user = request.user

        if not user.is_authenticated:
            return False

        # =============================================
        # SUPER USER
        # =============================================

        if (
            user.role == "SUPER_USER"
            and user.is_active
        ):
            return True

        # =============================================
        # HOSPITAL ADMIN
        # =============================================

        if (
            user.role == "HOSPITAL_ADMIN"
            and user.is_active
            and user.is_approved
            and user.hospital_id is not None
        ):
            return True

        return False