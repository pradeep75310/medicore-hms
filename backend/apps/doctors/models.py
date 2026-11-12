from django.conf import settings
from django.db import models


def doctor_document_path(instance, filename):
    return f"doctors/{instance.user_id}/documents/{filename}"


class DoctorProfile(models.Model):
    class RegistrationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="doctor_profile",
    )

    specialization = models.CharField(max_length=120, blank=True)
    qualification = models.CharField(max_length=255, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    bio = models.TextField(blank=True)

    available_from = models.TimeField(null=True, blank=True)
    available_to = models.TimeField(null=True, blank=True)
    is_available = models.BooleanField(default=True)

    degree_certificate = models.FileField(
        upload_to=doctor_document_path,
        blank=True,
        null=True,
    )
    experience_letter = models.FileField(
        upload_to=doctor_document_path,
        blank=True,
        null=True,
    )
    identity_document = models.FileField(
        upload_to=doctor_document_path,
        blank=True,
        null=True,
    )

    registration_status = models.CharField(
        max_length=20,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__first_name", "user__last_name"]

    def __str__(self):
        return f"Dr. {self.user.get_full_name() or self.user.username}"
