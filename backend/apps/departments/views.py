from rest_framework import filters, permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Department
from .serializers import DepartmentSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = (
        Department.objects
        .select_related("branch", "branch__hospital")
        .all()
    )

    serializer_class = DepartmentSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "code",
        "branch__name",
        "branch__hospital__name",
        "branch__hospital__hospital_code",
    ]

    ordering_fields = [
        "name",
        "code",
        "created_at",
        "updated_at",
        "status",
    ]

    ordering = ["name"]

    # =====================================================
    # ROLE CHECK
    # =====================================================

    def _is_super_user(self):
        user = self.request.user

        return (
            user.is_authenticated
            and user.is_active
            and user.is_superuser
            and user.role == "SUPER_USER"
        )

    def _is_hospital_admin(self):
        user = self.request.user

        return (
            user.is_authenticated
            and user.is_active
            and user.is_approved
            and user.role == "HOSPITAL_ADMIN"
            and user.hospital_id is not None
        )

    def _is_manager(self):
        return (
            self._is_super_user()
            or self._is_hospital_admin()
        )

    # =====================================================
    # MANAGER PERMISSION
    # =====================================================

    def _check_manager(self):
        if not self._is_manager():
            raise PermissionDenied(
                "Only Super User or Hospital Admin can manage departments."
            )

    # =====================================================
    # HOSPITAL SCOPE CHECK
    # =====================================================

    def _check_hospital_scope(self, branch):
        user = self.request.user

        if self._is_super_user():
            return

        if self._is_hospital_admin():

            if not user.hospital_id:
                raise PermissionDenied(
                    "You are not assigned to any hospital."
                )

            if not branch:
                raise PermissionDenied(
                    "Branch is required."
                )

            if branch.hospital_id != user.hospital_id:
                raise PermissionDenied(
                    "You can manage departments only in your hospital."
                )

            return

        raise PermissionDenied(
            "You do not have permission to manage departments."
        )

    # =====================================================
    # LIST / QUERYSET
    # =====================================================

    def get_queryset(self):
        user = self.request.user

        queryset = super().get_queryset()

        # -------------------------------------------------
        # SUPER USER
        # -------------------------------------------------

        if self._is_super_user():

            hospital_id = self.request.query_params.get(
                "hospital"
            )

            branch_id = self.request.query_params.get(
                "branch"
            )

            status_value = self.request.query_params.get(
                "status"
            )

            if hospital_id:
                queryset = queryset.filter(
                    branch__hospital_id=hospital_id
                )

            if branch_id:
                queryset = queryset.filter(
                    branch_id=branch_id
                )

            if status_value:
                queryset = queryset.filter(
                    status=status_value.upper()
                )

            return queryset

        # -------------------------------------------------
        # HOSPITAL ADMIN
        # -------------------------------------------------

        if self._is_hospital_admin():

            queryset = queryset.filter(
                branch__hospital_id=user.hospital_id
            )

            branch_id = self.request.query_params.get(
                "branch"
            )

            status_value = self.request.query_params.get(
                "status"
            )

            if branch_id:
                queryset = queryset.filter(
                    branch_id=branch_id
                )

            if status_value:
                queryset = queryset.filter(
                    status=status_value.upper()
                )

            return queryset

        # -------------------------------------------------
        # OTHER USERS
        # -------------------------------------------------

        return queryset.none()

    # =====================================================
    # CREATE
    # =====================================================

    def create(self, request, *args, **kwargs):

        self._check_manager()

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        branch = serializer.validated_data.get(
            "branch"
        )

        if not branch:
            raise PermissionDenied(
                "Branch is required."
            )
        self._check_hospital_scope(branch)

        self.perform_create(serializer)

        return Response(
            {
                "success": True,
                "message": "Department created successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    # =====================================================
    # UPDATE
    # =====================================================

    def update(self, request, *args, **kwargs):

        self._check_manager()

        instance = self.get_object()
        self._check_hospital_scope(
            instance.branch
        )

        partial = kwargs.pop(
            "partial",
            False
        )

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
        )

        serializer.is_valid(
            raise_exception=True
        )
        new_branch = serializer.validated_data.get(
            "branch",
            instance.branch
        )

        self._check_hospital_scope(
            new_branch
        )

        self.perform_update(serializer)

        return Response(
            {
                "success": True,
                "message": "Department updated successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    # =====================================================
    # DELETE
    # =====================================================

    def destroy(self, request, *args, **kwargs):

        self._check_manager()

        instance = self.get_object()

        self._check_hospital_scope(
            instance.branch
        )

        self.perform_destroy(
            instance
        )

        return Response(
            {
                "success": True,
                "message": "Department deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )