from rest_framework.permissions import BasePermission


class IsSuperUserOrHospitalAdmin(BasePermission):

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        if request.user.role == "SUPER_USER":
            return True

        if (
            request.user.role == "HOSPITAL_ADMIN"
            and request.user.is_active
            and request.user.is_approved
        ):
            return True

        return False