from rest_framework import viewsets, permissions, filters
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import Branch
from .serializers import BranchSerializer
from apps.hospitals.models import Hospital




class BranchViewSet(viewsets.ModelViewSet):
  

    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):

        if self.request.method == "GET":
            return [permissions.AllowAny()]

        return [permissions.IsAuthenticated()]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "branch_code",
        "city",
        "state",
        "hospital__name",
        "hospital__hospital_code",
    ]

    ordering_fields = [
        "name",
        "branch_code",
        "created_at",
        "updated_at",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user

        queryset = (
            Branch.objects
            .select_related("hospital")
            .all()
        )
        
        # -------------------------------------------------
        # PUBLIC BRANCH LIST - PATIENT REGISTRATION
        # -------------------------------------------------
        if not user.is_authenticated:

            hospital_id = self.request.query_params.get("hospital")

            if not hospital_id:
                return queryset.none()

            return queryset.filter(
                hospital_id=hospital_id,
                status="ACTIVE"
            )


        # -------------------------------------------------
        # SUPER USER
        # -------------------------------------------------
        if (
            user.is_authenticated
            and user.is_active
            and user.is_superuser
            and user.role == "SUPER_USER"
        ):
            hospital_id = self.request.query_params.get("hospital")

            if hospital_id:
                queryset = queryset.filter(
                    hospital_id=hospital_id
                )

            return queryset

        # -------------------------------------------------
        # HOSPITAL ADMIN
        # -------------------------------------------------
        if (
            user.is_authenticated
            and user.is_active
            and user.is_approved
            and user.role == "HOSPITAL_ADMIN"
            and user.hospital_id
        ):
            return queryset.filter(
                hospital_id=user.hospital_id
            )

        # -------------------------------------------------
        # BRANCH-SCOPED USERS
        # -------------------------------------------------
        if user.is_authenticated and user.branch_id:
            return queryset.filter(
                id=user.branch_id
            )

        # -------------------------------------------------
        # ALL OTHER USERS
        # -------------------------------------------------
        return queryset.none()

    # =====================================================
    # CREATE
    # =====================================================

    def perform_create(self, serializer):
        user = self.request.user

        # -------------------------------------------------
        # SUPER USER
        # -------------------------------------------------
        if (
            user.is_active
            and user.is_superuser
            and user.role == "SUPER_USER"
        ):
            hospital = serializer.validated_data.get("hospital")

            if not hospital:
                raise ValidationError({
                    "hospital": "Hospital is required."
                })

            if not Hospital.objects.filter(
                id=hospital.id
            ).exists():
                raise ValidationError({
                    "hospital": "Selected hospital does not exist."
                })

            serializer.save(
                hospital=hospital
            )
            return

        # -------------------------------------------------
        # HOSPITAL ADMIN
        # -------------------------------------------------
        if (
            user.is_active
            and user.is_approved
            and user.role == "HOSPITAL_ADMIN"
        ):
            if not user.hospital_id:
                raise PermissionDenied(
                    "You are not assigned to any hospital."
                )
            
            serializer.save(
                hospital=user.hospital
            )
            return

        # -------------------------------------------------
        # OTHER USERS
        # -------------------------------------------------

        raise PermissionDenied(
            "You do not have permission to create a branch."
        )

    # =====================================================
    # UPDATE
    # =====================================================

    def perform_update(self, serializer):
        user = self.request.user
        branch = self.get_object()

        # -------------------------------------------------
        # SUPER USER
        # -------------------------------------------------

        if (
            user.is_active
            and user.is_superuser
            and user.role == "SUPER_USER"
        ):
            serializer.save()
            return

        # -------------------------------------------------
        # HOSPITAL ADMIN
        # -------------------------------------------------

        if (
            user.is_active
            and user.is_approved
            and user.role == "HOSPITAL_ADMIN"
        ):
            if not user.hospital_id:
                raise PermissionDenied(
                    "You are not assigned to any hospital."
                )
           
            if branch.hospital_id != user.hospital_id:
                raise PermissionDenied(
                    "You cannot update a branch from another hospital."
                )
            serializer.save(
                hospital=user.hospital
            )
            return

        raise PermissionDenied(
            "You do not have permission to update a branch."
        )

    # =====================================================
    # DELETE
    # =====================================================

    def perform_destroy(self, instance):
        user = self.request.user

        # -------------------------------------------------
        # SUPER USER
        # -------------------------------------------------

        if (
            user.is_active
            and user.is_superuser
            and user.role == "SUPER_USER"
        ):
            instance.delete()
            return

        # -------------------------------------------------
        # HOSPITAL ADMIN
        # -------------------------------------------------

        if (
            user.is_active
            and user.is_approved
            and user.role == "HOSPITAL_ADMIN"
        ):
            if not user.hospital_id:
                raise PermissionDenied(
                    "You are not assigned to any hospital."
                )

            if instance.hospital_id != user.hospital_id:
                raise PermissionDenied(
                    "You cannot delete a branch from another hospital."
                )

            instance.delete()
            return

        raise PermissionDenied(
            "You do not have permission to delete a branch."
        )