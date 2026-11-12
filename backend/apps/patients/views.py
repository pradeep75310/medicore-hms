from django.db.models import Q
from django.utils import timezone

from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from .models import Patient
from .serializers import (
    PatientSerializer,
    PatientAccountCreateSerializer,
    PatientCompleteRegistrationSerializer,
)


SUPERUSER_ROLES = {"SUPER_USER", "SUPER_ADMIN"}
ADMIN_ROLES = SUPERUSER_ROLES | {"HOSPITAL_ADMIN"}
PATIENT_MANAGEMENT_ROLES = ADMIN_ROLES | {"RECEPTIONIST"}


class PatientViewSet(viewsets.ModelViewSet):

    queryset = (
        Patient.objects
        .select_related(
            "user",
            "branch",
            "branch__hospital",
            "department",
            "assigned_doctor",
        )
        .all()
    )

    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "patient_id"

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "first_name",
        "middle_name",
        "last_name",
        "email",
        "mobile_number",
        "patient_id",
        "city",
        "user__username",
        "branch__name",
        "branch__hospital__name",
    ]

    ordering_fields = [
        "first_name",
        "created_at",
        "date_of_birth",
    ]

    ordering = ["-created_at"]

    # --------------------------------------------------
    # QUERYSET / ACCESS CONTROL
    # --------------------------------------------------

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated or not user.is_active:
            return queryset.none()

        if user.role in SUPERUSER_ROLES and user.is_superuser:
            pass

        elif user.role == "HOSPITAL_ADMIN":
            if not user.is_approved or not user.hospital_id:
                return queryset.none()

            queryset = queryset.filter(
                branch__hospital_id=user.hospital_id
            )

        elif user.role == "RECEPTIONIST":
            if not user.is_approved or not user.branch_id:
                return queryset.none()

            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        elif user.role == "DOCTOR":
            queryset = queryset.filter(
                assigned_doctor=user
            )

        elif user.role == "PATIENT":
            queryset = queryset.filter(user=user)

        elif user.role == "NURSE":
            if not user.branch_id:
                return queryset.none()

            queryset = queryset.filter(
                branch_id=user.branch_id
            )

        else:
            return queryset.none()
       
        include_archived = (
            self.request.query_params.get("include_archived", "false")
            .lower()
            == "true"
        )

        if include_archived:
            if not (
                user.role in SUPERUSER_ROLES
                and user.is_superuser
            ) and user.role != "HOSPITAL_ADMIN":
                raise PermissionDenied(
                    "Only authorized administrators can view archived patients."
                )

            if user.role == "HOSPITAL_ADMIN":
                if not user.is_approved or not user.hospital_id:
                    return queryset.none()
        else:
            queryset = queryset.filter(is_archived=False)

        hospital_id = self.request.query_params.get("hospital")
        branch_id = self.request.query_params.get("branch")
        status_filter = self.request.query_params.get("status")
        registration_status = self.request.query_params.get(
            "registration_status"
        )

        if hospital_id:
            if not hospital_id.isdigit():
                raise ValidationError({
                    "hospital": "Hospital ID must be an integer."
                })

            queryset = queryset.filter(
                branch__hospital_id=int(hospital_id)
            )

        if branch_id:
            if not branch_id.isdigit():
                raise ValidationError({
                    "branch": "Branch ID must be an integer."
                })

            queryset = queryset.filter(
                branch_id=int(branch_id)
            )

        if status_filter:
            if status_filter == "active":
                queryset = queryset.filter(user__is_active=True)

            elif status_filter == "inactive":
                queryset = queryset.filter(
                    Q(user__is_active=False)
                    | Q(user__isnull=True)
                )

            else:
                raise ValidationError({
                    "status": "Use 'active' or 'inactive'."
                })

        if registration_status == "completed":
            queryset = queryset.filter(
                first_name__gt="",
                last_name__gt="",
                date_of_birth__isnull=False,
                gender__gt="",
                email__gt="",
                mobile_number__gt="",
                address_line__gt="",
                city__gt="",
                state__gt="",
                postal_code__gt="",
                branch__isnull=False,
            )

        elif registration_status == "incomplete":
            queryset = queryset.filter(
                Q(first_name="")
                | Q(last_name="")
                | Q(date_of_birth__isnull=True)
                | Q(gender="")
                | Q(email="")
                | Q(mobile_number__isnull=True)
                | Q(mobile_number="")
                | Q(address_line="")
                | Q(city="")
                | Q(state="")
                | Q(postal_code="")
                | Q(branch__isnull=True)
            )

        elif registration_status:
            raise ValidationError({
                "registration_status": (
                    "Use 'completed' or 'incomplete'."
                )
            })

        return queryset.distinct()

    # --------------------------------------------------
    # SERIALIZER SELECTION
    # --------------------------------------------------

    def get_serializer_class(self):
        if self.action == "create_account":
            return PatientAccountCreateSerializer

        if self.action == "complete_registration":
            return PatientCompleteRegistrationSerializer

        return PatientSerializer

    # --------------------------------------------------
    # PERMISSION HELPERS
    # --------------------------------------------------

    def require_patient_management_access(self):
        user = self.request.user

        if not user.is_active:
            raise PermissionDenied("Your account is inactive.")

        if user.role in SUPERUSER_ROLES:
            if not user.is_superuser:
                raise PermissionDenied(
                    "Super User privileges are required."
                )
            return

        if user.role == "HOSPITAL_ADMIN":
            if not user.is_approved or not user.hospital_id:
                raise PermissionDenied(
                    "An approved Hospital Admin account is required."
                )
            return

        if user.role == "RECEPTIONIST":
            if not user.is_approved or not user.branch_id:
                raise PermissionDenied(
                    "An approved Receptionist with an assigned branch is required."
                )
            return

        raise PermissionDenied(
            "You are not allowed to manage patient records."
        )

    def require_admin_access(self):
        user = self.request.user

        if not user.is_active:
            raise PermissionDenied("Your account is inactive.")

        if user.role in SUPERUSER_ROLES and user.is_superuser:
            return

        if (
            user.role == "HOSPITAL_ADMIN"
            and user.is_approved
            and user.hospital_id
        ):
            return

        raise PermissionDenied(
            "Only a Super User or approved Hospital Admin can perform this action."
        )

    # --------------------------------------------------
    # DISABLE DEFAULT CREATE
    # --------------------------------------------------

    def create(self, request, *args, **kwargs):
        raise PermissionDenied(
            "Use POST /api/patients/create-account/ to create a patient."
        )

    # --------------------------------------------------
    # DISABLE DEFAULT UPDATE
    # --------------------------------------------------

    def update(self, request, *args, **kwargs):
        raise PermissionDenied(
            "Use PATCH /api/patients/{patient_id}/complete-registration/."
        )

    def partial_update(self, request, *args, **kwargs):
        raise PermissionDenied(
            "Use PATCH /api/patients/{patient_id}/complete-registration/."
        )

    # --------------------------------------------------
    # CREATE PATIENT ACCOUNT
    # --------------------------------------------------

    @action(
        detail=False,
        methods=["post"],
        url_path="create-account",
    )
    def create_account(self, request):
        self.require_patient_management_access()

        serializer = self.get_serializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)
        patient = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Patient account created successfully.",
                "data": PatientSerializer(
                    patient,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # --------------------------------------------------
    # COMPLETE / UPDATE PATIENT PROFILE
    # --------------------------------------------------

    @action(
        detail=True,
        methods=["patch"],
        url_path="complete-registration",
    )
    def complete_registration(self, request, patient_id=None):
        patient = self.get_object()
        actor = request.user

        if patient.is_archived:
            raise PermissionDenied(
                "Archived patient records cannot be edited."
            )

        if actor.role == "PATIENT":
            if patient.user_id != actor.id:
                raise PermissionDenied(
                    "You can update only your own profile."
                )

        elif actor.role in PATIENT_MANAGEMENT_ROLES:
            if actor.role == "RECEPTIONIST":
                if (
                    not actor.is_approved
                    or not actor.branch_id
                    or patient.branch_id != actor.branch_id
                ):
                    raise PermissionDenied(
                        "You can manage patients only in your assigned branch."
                    )
            else:
                self.require_patient_management_access()

        else:
            raise PermissionDenied(
                "You are not allowed to update this patient profile."
            )

        serializer = PatientCompleteRegistrationSerializer(
            patient,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        patient.refresh_from_db()

        return Response(
            {
                "success": True,
                "message": "Patient profile updated successfully.",
                "data": PatientSerializer(
                    patient,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    # --------------------------------------------------
    # ACTIVATE / DEACTIVATE PATIENT LOGIN
    # --------------------------------------------------

    @action(
        detail=True,
        methods=["patch"],
        url_path="status",
    )
    def status_update(self, request, patient_id=None):
        self.require_admin_access()
        patient = self.get_object()

        is_active = request.data.get("is_active")

        if not isinstance(is_active, bool):
            return Response(
                {
                    "success": False,
                    "message": "is_active must be true or false.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not patient.user_id:
            return Response(
                {
                    "success": False,
                    "message": "Patient has no linked login account.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        patient.user.is_active = is_active
        patient.user.save(update_fields=["is_active"])

        return Response(
            {
                "success": True,
                "message": (
                    "Patient activated successfully."
                    if is_active
                    else "Patient deactivated successfully."
                ),
                "data": {
                    "patient_id": str(patient.patient_id),
                    "is_active": patient.user.is_active,
                },
            },
            status=status.HTTP_200_OK,
        )

    # --------------------------------------------------
    # ARCHIVE PATIENT
    # --------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="archive",
    )
    def archive(self, request, patient_id=None):
        self.require_admin_access()
        patient = self.get_object()

        if patient.is_archived:
            return Response(
                {
                    "success": False,
                    "message": "Patient is already archived.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "")
        reason = reason.strip() if isinstance(reason, str) else ""

        patient.is_archived = True
        patient.archived_at = timezone.now()
        patient.archived_by = request.user
        patient.archive_reason = reason

        patient.save(
            update_fields=[
                "is_archived",
                "archived_at",
                "archived_by",
                "archive_reason",
                "updated_at",
            ]
        )

        return Response(
            {
                "success": True,
                "message": "Patient archived successfully.",
                "data": {
                    "patient_id": str(patient.patient_id),
                    "is_archived": patient.is_archived,
                    "archived_at": patient.archived_at,
                },
            },
            status=status.HTTP_200_OK,
        )

    # --------------------------------------------------
    # PERMANENT DELETE DISABLED
    # --------------------------------------------------

    def destroy(self, request, *args, **kwargs):
        self.require_admin_access()

        raise PermissionDenied(
            "Permanent patient deletion is disabled to protect medical history. "
            "Use the archive endpoint instead."
        )
