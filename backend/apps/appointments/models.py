
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Appointment(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        CHECKED_IN = "CHECKED_IN", "Checked In"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        RESCHEDULED = "RESCHEDULED", "Rescheduled"
        NO_SHOW = "NO_SHOW", "No Show"

    class Type(models.TextChoices):
        CONSULTATION = "CONSULTATION", "Consultation"
        FOLLOW_UP = "FOLLOW_UP", "Follow-up"
        EMERGENCY = "EMERGENCY", "Emergency"
        TELECONSULTATION = "TELECONSULTATION", "Teleconsultation"

    appointment_number = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    patient = models.ForeignKey(
        "patients.Patient",
        on_delete=models.PROTECT,
        related_name="appointments",
    )

    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="doctor_appointments",
        limit_choices_to={"role": "DOCTOR"},
    )

    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.PROTECT,
        related_name="appointments",
    )

    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
    )

    appointment_type = models.CharField(
        max_length=25,
        choices=Type.choices,
        default=Type.CONSULTATION,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    scheduled_at = models.DateTimeField(db_index=True)

    duration_minutes = models.PositiveSmallIntegerField(default=30)

    reason = models.CharField(max_length=255)

    symptoms = models.TextField(blank=True)

    patient_notes = models.TextField(blank=True)

    clinical_notes = models.TextField(blank=True)

    cancellation_reason = models.TextField(blank=True)

    booked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_appointments",
    )

    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cancelled_appointments",
    )

    cancelled_at = models.DateTimeField(null=True, blank=True)

    rescheduled_from = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rescheduled_appointments",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-scheduled_at"]
        indexes = [
            models.Index(
                fields=["branch", "scheduled_at"],
                name="appt_branch_date_idx",
            ),
            models.Index(
                fields=["doctor", "scheduled_at"],
                name="appt_doctor_date_idx",
            ),
            models.Index(
                fields=["patient", "scheduled_at"],
                name="appt_patient_date_idx",
            ),
            models.Index(
                fields=["status", "scheduled_at"],
                name="appt_status_date_idx",
            ),
        ]

    def clean(self):
        errors = {}

        if self.duration_minutes < 5 or self.duration_minutes > 240:
            errors["duration_minutes"] = (
                "Appointment duration must be between 5 and 240 minutes."
            )

        if self.doctor_id and self.doctor.role != "DOCTOR":
            errors["doctor"] = "Selected user is not a doctor."

        if self.patient_id and self.patient.is_archived:
            errors["patient"] = "Archived patients cannot book appointments."

        if self.branch_id:
            if not self.branch.hospital_id:
                errors["branch"] = "Selected branch has no hospital."

            if self.doctor_id and self.doctor.hospital_id != self.branch.hospital_id:
                errors["doctor"] = (
                    "Doctor must belong to the appointment's hospital."
                )

            if (
                self.patient_id
                and self.patient.branch_id
                and self.patient.branch.hospital_id != self.branch.hospital_id
            ):
                errors["patient"] = (
                    "Patient and appointment must belong to the same hospital."
                )

        if self.department_id and self.branch_id:
            if (
                not self.department.branch_id
                or self.department.branch_id != self.branch_id
            ):
                errors["department"] = (
                    "Department must belong to the selected branch."
        )

        if errors:  
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def ends_at(self):
        from datetime import timedelta

        return self.scheduled_at + timedelta(
            minutes=self.duration_minutes
        )

    def __str__(self):
        return (
            f"{self.appointment_number} - "
            f"{self.patient.full_name} - "
            f"{self.scheduled_at:%Y-%m-%d %H:%M}"
        )
