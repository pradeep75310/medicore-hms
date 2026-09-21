from rest_framework.permissions import BasePermission

class IsSuperUser(BasePermission):
    
    def has_permission (self , request , view):
         return (
            request.user.is_authenticated
            and request.user.is_superuser
            and request.user.role == "SUPER_USER"
        )
         
class IsHospitalAdmin(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "HOSPITAL_ADMIN"
            and request.user.is_approved
            and request.user.is_active
        )

class IsSuperUserOrHospitalAdmin(BasePermission):

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        return (
            request.user.is_superuser
            or (
                request.user.role == "HOSPITAL_ADMIN"
                and request.user.is_approved
                and request.user.is_active
            )
        )


class IsPatient(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "PATIENT"
            and request.user.is_active
        )
        
class IsDoctor(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "DOCTOR"
            and request.user.is_active
        )


class IsNurse(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "NURSE"
            and request.user.is_active
        )


class IsReceptionist(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "RECEPTIONIST"
            and request.user.is_active
        )
        
        
class IsPharmacist(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "PHARMACIST"
            and request.user.is_active
        )


class IsAccountant(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ACCOUNTANT"
            and request.user.is_active
        )


class IsLabTechnician(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "LAB_TECHNICIAN"
            and request.user.is_active
        )
        
        
class IsHospitalAdminOrSuperUser(BasePermission):

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return (
            request.user.role == "HOSPITAL_ADMIN"
            and request.user.is_active
            and request.user.is_approved
        )                                 