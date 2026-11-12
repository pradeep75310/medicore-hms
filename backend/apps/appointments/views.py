
from datetime import timedelta
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.departments.models import Department
from apps.patients.models import Patient
from .models import Appointment
from .serializers import (
    AppointmentRescheduleSerializer,
    AppointmentSerializer,
    AppointmentStatusSerializer,
)

SUPERUSER_ROLES = {"SUPER_USER", "SUPER_ADMIN"}
MANAGER_ROLES = SUPERUSER_ROLES | {"HOSPITAL_ADMIN"}
CREATE_ROLES = MANAGER_ROLES | {"RECEPTIONIST", "DOCTOR", "PATIENT"}
ACTIVE_APPOINTMENT_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"]


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    queryset = Appointment.objects.select_related(
        "patient", "doctor", "branch", "department", "booked_by", "cancelled_by"
    ).all()
    http_method_names = ["get", "post", "patch", "head", "options"]

    def _is_superuser(self, user):
        return bool(user.is_superuser and user.role in SUPERUSER_ROLES) or user.role in SUPERUSER_ROLES

    def _ensure_active(self):
        user = self.request.user
        if not user.is_active:
            raise PermissionDenied("Your account is inactive.")
        if user.role == "HOSPITAL_ADMIN" and (not user.is_approved or not user.hospital_id):
            raise PermissionDenied("An approved Hospital Admin assigned to a hospital is required.")
        if user.role in {"DOCTOR", "RECEPTIONIST", "NURSE"} and not user.is_approved:
            raise PermissionDenied("Your staff account must be approved before using appointments.")
        if user.role not in CREATE_ROLES and not self._is_superuser(user):
            raise PermissionDenied("Your role is not allowed to access appointments.")

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if not user.is_authenticated:
            return queryset.none()
        if self._is_superuser(user):
            pass
        elif user.role == "HOSPITAL_ADMIN":
            queryset = queryset.filter(branch__hospital_id=user.hospital_id)
        elif user.role in {"RECEPTIONIST", "NURSE"}:
            if user.branch_id:
                queryset = queryset.filter(branch_id=user.branch_id)
            elif user.hospital_id:
                queryset = queryset.filter(branch__hospital_id=user.hospital_id)
            else:
                return queryset.none()
        elif user.role == "DOCTOR":
            queryset = queryset.filter(doctor=user)
        elif user.role == "PATIENT":
            patient = Patient.objects.filter(user=user).first()
            return queryset.filter(patient=patient) if patient else queryset.none()
        else:
            return queryset.none()

        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(patient__first_name__icontains=search)
                | Q(patient__last_name__icontains=search)
                | Q(doctor__first_name__icontains=search)
                | Q(doctor__last_name__icontains=search)
                | Q(appointment_number__icontains=search)
                | Q(reason__icontains=search)
            )
        status_filter = self.request.query_params.get("status")
        if status_filter and status_filter.upper() != "ALL":
            queryset = queryset.filter(status=status_filter.upper())
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            queryset = queryset.filter(scheduled_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(scheduled_at__date__lte=date_to)
        doctor_id = self.request.query_params.get("doctor")
        patient_id = self.request.query_params.get("patient")
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if patient_id and user.role != "PATIENT":
            queryset = queryset.filter(patient_id=patient_id)
        return queryset.distinct()

    def list(self, request, *args, **kwargs):
        self._ensure_active()
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        self._ensure_active()
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        self._ensure_active()

        if (
            request.user.role not in CREATE_ROLES
            and not self._is_superuser(request.user)
        ):
            raise PermissionDenied(
                "You are not allowed to create appointments."
            )
        if request.user.role == "DOCTOR":
            data = request.data.copy()
            data["doctor"] = request.user.pk
        else:
            data = request.data

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        self.perform_create(serializer)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


    def perform_create(self, serializer):
        user = self.request.user

        patient = serializer.validated_data.get("patient")
        branch = serializer.validated_data.get("branch")
        doctor = serializer.validated_data.get("doctor")

        if not branch:
            raise ValidationError({
                "branch": "Please select a branch."
            })
        if not self._is_superuser(user):

            if user.role == "HOSPITAL_ADMIN":
                if branch.hospital_id != user.hospital_id:
                    raise PermissionDenied(
                        "You can create appointments only within your hospital."
                    )

            elif user.role in {"RECEPTIONIST", "NURSE"}:
                if (
                    user.branch_id
                    and branch.id != user.branch_id
                ):
                    raise PermissionDenied(
                        "You can create appointments only in your assigned branch."
                    )

                if (
                    not user.branch_id
                    and user.hospital_id
                    and branch.hospital_id != user.hospital_id
                ):
                    raise PermissionDenied(
                        "You can create appointments only within your hospital."
                    )
        if not patient:
            raise ValidationError({
                "patient": "Please select a patient."
            })

        if patient.is_archived:
            raise ValidationError({
                "patient": "Archived patients cannot book appointments."
            })

        if (
            patient.branch_id
            and patient.branch.hospital_id != branch.hospital_id
        ):
            raise ValidationError({
                "patient": "Patient belongs to a different hospital."
            })

        if user.role == "PATIENT":
            linked_patient = Patient.objects.filter(
                user=user
            ).first()

            if (
                not linked_patient
                or linked_patient.pk != patient.pk
            ):
                raise PermissionDenied(
                    "You can book appointments only for your own patient profile."
                )
        if not doctor:
            raise ValidationError({
                "doctor": (
                    "No doctor was assigned. Check doctor availability "
                    "for the selected branch and department."
                )
            })

        if (
            doctor.role != "DOCTOR"
            or not doctor.is_active
            or not doctor.is_approved
        ):
            raise ValidationError({
                "doctor": "The assigned doctor must be active and approved."
            })

        if doctor.branch_id != branch.id:
            raise ValidationError({
                "doctor": "Doctor must belong to the selected branch."
            })

        if doctor.hospital_id != branch.hospital_id:
            raise ValidationError({
                "doctor": "Doctor must belong to the selected hospital."
            })

        if (
            user.role == "DOCTOR"
            and doctor.pk != user.pk
        ):
            raise PermissionDenied(
                "Doctors can create appointments only for themselves."
            )

        serializer.save()
    def partial_update(self, request, *args, **kwargs):
        self._ensure_active()
        appointment = self.get_object()
        if request.user.role not in MANAGER_ROLES and request.user.role != "DOCTOR":
            raise PermissionDenied("Only hospital management or the assigned doctor can update appointment details.")
        if request.user.role == "DOCTOR" and appointment.doctor_id != request.user.id:
            raise PermissionDenied("You can update only your own appointments.")
        forbidden = {"status", "patient", "doctor", "branch", "cancelled_by", "cancelled_at", "booked_by", "rescheduled_from"}
        if forbidden.intersection(request.data.keys()):
            raise ValidationError("Use the dedicated status, cancel, or reschedule actions for protected fields.")
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        raise PermissionDenied("Appointments cannot be permanently deleted. Cancel the appointment instead.")

    @action(detail=False, methods=["get"], url_path="lookups")
    def lookups(self, request):
        """
        Return appointment form options scoped to the logged-in user's access.
        Optional branch_id narrows doctors and departments to one selected branch.
        """
        self._ensure_active()
        user = request.user

        branches = Branch.objects.filter(
            status="ACTIVE",
            hospital__isnull=False,
            hospital__status="ACTIVE",
        ).select_related("hospital")

        doctors = User.objects.filter(
            role="DOCTOR",
            is_active=True,
            is_approved=True,
            branch__isnull=False,
            branch__status="ACTIVE",
            branch__hospital__isnull=False,
        ).filter(hospital_id=F("branch__hospital_id")).select_related("branch", "department")

        patients = Patient.objects.filter(is_archived=False).select_related(
            "branch", "user"
        )
        departments = Department.objects.filter(
            status="ACTIVE",
            branch__isnull=False,
            branch__status="ACTIVE",
        ).select_related("branch")

        patient_context = None
        hospital_id = user.hospital_id

        if not self._is_superuser(user):
            if user.role == "PATIENT":
                patient = patients.filter(user=user).first()
                if patient:
                    patient_branch = patient.branch
                    patient_hospital = (
                        patient_branch.hospital if patient_branch else None
                    )
                    patient_context = {
                        "id": patient.pk,
                        "name": patient.full_name,
                        "branch_id": patient.branch_id,
                        "branch_name": patient_branch.name if patient_branch else "",
                        "hospital_id": patient_hospital.pk if patient_hospital else None,
                        "hospital_name": patient_hospital.name if patient_hospital else "",
                    }
                    if patient_hospital:
                        hospital_id = patient_hospital.pk
                        branches = branches.filter(hospital_id=hospital_id)
                        doctors = doctors.filter(branch__hospital_id=hospital_id)
                        departments = departments.filter(branch__hospital_id=hospital_id)
                    else:
                        branches = branches.none()
                        doctors = doctors.none()
                        departments = departments.none()
                else:
                    patients = patients.none()
                    branches = branches.none()
                    doctors = doctors.none()
                    departments = departments.none()
            elif user.role == "HOSPITAL_ADMIN":
                if not hospital_id:
                    branches, doctors, patients, departments = (
                        branches.none(), doctors.none(), patients.none(), departments.none()
                    )
                else:
                    branches = branches.filter(hospital_id=hospital_id)
                    doctors = doctors.filter(branch__hospital_id=hospital_id)
                    patients = patients.filter(branch__hospital_id=hospital_id)
                    departments = departments.filter(branch__hospital_id=hospital_id)
            elif user.role in {"RECEPTIONIST", "NURSE"}:
                if user.branch_id:
                    branches = branches.filter(pk=user.branch_id)
                    doctors = doctors.filter(branch_id=user.branch_id)
                    patients = patients.filter(branch_id=user.branch_id)
                    departments = departments.filter(branch_id=user.branch_id)
                elif hospital_id:
                    branches = branches.filter(hospital_id=hospital_id)
                    doctors = doctors.filter(branch__hospital_id=hospital_id)
                    patients = patients.filter(branch__hospital_id=hospital_id)
                    departments = departments.filter(branch__hospital_id=hospital_id)
                else:
                    branches, doctors, patients, departments = (
                        branches.none(), doctors.none(), patients.none(), departments.none()
                    )
            elif user.role == "DOCTOR":
                doctors = doctors.filter(pk=user.pk)
                branches = branches.filter(pk=user.branch_id) if user.branch_id else branches.none()
                patients = patients.filter(
                    Q(assigned_doctor=user) | Q(branch__hospital_id=user.hospital_id)
                )
                departments = departments.filter(branch_id=user.branch_id) if user.branch_id else departments.none()
            else:
                branches, doctors, patients, departments = (
                    branches.none(), doctors.none(), patients.none(), departments.none()
                )
        branch_id = request.query_params.get("branch_id")
        if branch_id:
            try:
                branch_id = int(branch_id)
            except (TypeError, ValueError):
                branches_for_user = branches.none()
                doctors = doctors.none()
                departments = departments.none()
            else:
                allowed_branch = branches.filter(pk=branch_id).exists()
                if allowed_branch:
                    doctors = doctors.filter(
                        branch_id=branch_id,
                        hospital_id=F("branch__hospital_id"),
                    )
                    departments = departments.filter(branch_id=branch_id)
                else:
                    doctors = doctors.none()
                    departments = departments.none()

        return Response({
            "patient_context": patient_context,
            "branches": [
                {
                    "id": branch.pk,
                    "name": branch.name,
                    "hospital_id": branch.hospital_id,
                    "hospital_name": branch.hospital.name if branch.hospital_id else "",
                }
                for branch in branches.order_by("name")
            ],
            "doctors": [
                {
                    "id": doctor.pk,
                    "name": doctor.get_full_name().strip() or doctor.username,
                    "branch_id": doctor.branch_id,
                    "hospital_id": doctor.branch.hospital_id if doctor.branch_id else doctor.hospital_id,
                    "department_id": doctor.department_id,
                    "department_name": doctor.department.name if doctor.department_id else "",
                }
                for doctor in doctors.order_by("first_name", "last_name")
            ],
            "patients": [
                {
                    "id": patient.pk,
                    "patient_id": str(patient.patient_id),
                    "name": patient.full_name,
                    "branch_id": patient.branch_id,
                    "hospital_id": patient.branch.hospital_id if patient.branch_id else None,
                    "email": patient.email,
                    "mobile_number": patient.mobile_number or "",
                }
                for patient in patients.order_by("first_name", "last_name")
            ],
            "departments": [
                {
                    "id": department.pk,
                    "name": department.name,
                    "branch_id": department.branch_id,
                }
                for department in departments.order_by("name")
            ],
            "appointment_types": [
                {"value": value, "label": label}
                for value, label in Appointment._meta.get_field("appointment_type").choices
            ],
            "statuses": [
                {"value": value, "label": label}
                for value, label in Appointment._meta.get_field("status").choices
            ],
        })

    @action(detail=True, methods=["post"], url_path="cancel")
    @transaction.atomic
    def cancel(self, request, pk=None):
        self._ensure_active()
        appointment = self.get_object()
        reason = str(request.data.get("reason", "")).strip()
        if appointment.status in {"CANCELLED", "COMPLETED", "RESCHEDULED"}:
            raise ValidationError({"status": f"Cannot cancel an appointment with status {appointment.status}."})
        if request.user.role == "PATIENT" and appointment.patient.user_id != request.user.id:
            raise PermissionDenied("You can cancel only your own appointments.")
        appointment.status = "CANCELLED"
        appointment.cancellation_reason = reason
        appointment.cancelled_at = timezone.now()
        appointment.cancelled_by = request.user
        appointment.save()
        return Response({"success": True, "message": "Appointment cancelled.", "data": self.get_serializer(appointment).data})

    @action(detail=True, methods=["post"], url_path="reschedule")
    @transaction.atomic
    def reschedule(self, request, pk=None):
        self._ensure_active()
        old = self.get_object()
        if old.status in {"CANCELLED", "COMPLETED", "RESCHEDULED", "NO_SHOW"}:
            raise ValidationError({"status": "This appointment can no longer be rescheduled."})
        if request.user.role == "PATIENT" and old.patient.user_id != request.user.id:
            raise PermissionDenied("You can reschedule only your own appointments.")
        old.status = "RESCHEDULED"
        old.save(update_fields=["status", "updated_at"])
        form = AppointmentRescheduleSerializer(data=request.data)
        form.is_valid(raise_exception=True)
        new_time = form.validated_data["scheduled_at"]
        duration = form.validated_data.get("duration_minutes", old.duration_minutes)
        new_reason = form.validated_data.get("reason", old.reason)
        payload = {
            "patient": old.patient_id,
            "doctor": old.doctor_id,
            "branch": old.branch_id,
            "department": old.department_id,
            "appointment_type": old.appointment_type,
            "scheduled_at": new_time,
            "duration_minutes": duration,
            "reason": new_reason,
            "symptoms": old.symptoms,
            "patient_notes": old.patient_notes,
        }
        serializer = AppointmentSerializer(data=payload, context={"request": request})
        serializer.is_valid(raise_exception=True)
        new_appointment = serializer.save(rescheduled_from=old)
        return Response({"success": True, "message": "Appointment rescheduled successfully.", "data": self.get_serializer(new_appointment).data}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        self._ensure_active()
        appointment = self.get_object()
        if request.user.role not in MANAGER_ROLES | {"DOCTOR", "RECEPTIONIST"}:
            raise PermissionDenied("You are not allowed to change appointment status.")
        if request.user.role == "DOCTOR" and appointment.doctor_id != request.user.id:
            raise PermissionDenied("You can update only your own appointments.")
        form = AppointmentStatusSerializer(data=request.data)
        form.is_valid(raise_exception=True)
        next_status = form.validated_data["status"]
        allowed = {
            "PENDING": {"CONFIRMED", "CANCELLED", "NO_SHOW"},
            "CONFIRMED": {"CHECKED_IN", "CANCELLED", "NO_SHOW"},
            "CHECKED_IN": {"IN_PROGRESS", "CANCELLED"},
            "IN_PROGRESS": {"COMPLETED"},
        }
        if next_status not in allowed.get(appointment.status, set()):
            raise ValidationError({"status": f"Transition from {appointment.status} to {next_status} is not allowed."})
        appointment.status = next_status
        if next_status == "CANCELLED":
            appointment.cancelled_at = timezone.now()
            appointment.cancelled_by = request.user
            appointment.cancellation_reason = str(request.data.get("reason", "")).strip()
        appointment.save()
        return Response({"success": True, "data": self.get_serializer(appointment).data})















