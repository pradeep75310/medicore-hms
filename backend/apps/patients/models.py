import uuid

from django.conf import settings
from django.db import models


class Patient(models.Model):

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"
        PREFER_NOT_TO_SAY = "prefer_not_to_say", "Prefer not to say"

    class IdProofType(models.TextChoices):
        AADHAAR = "aadhaar", "Aadhaar"
        PASSPORT = "passport", "Passport"
        DRIVING_LICENSE = "driving_license", "Driving License"
        VOTER_ID = "voter_id", "Voter ID"
        OTHER = "other", "Other"
    patient_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patient_profile",
    )
   
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="patients",
    )

    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patients",
    )

    assigned_doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_patients",
        limit_choices_to={"role": "DOCTOR"},
    )
    
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)

    date_of_birth = models.DateField(null=True, blank=True)

    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        blank=True,
    )
    email = models.EmailField(unique=True)
    mobile_number = models.CharField(
        max_length=16,
        unique=True,
        null=True,
        blank=True,
    )

    address_line = models.CharField(max_length=255, blank=True)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default="India")

 
    blood_group = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True)
    medical_history = models.TextField(blank=True)

    
    emergency_contact = models.CharField(max_length=150, blank=True)
    emergency_phone = models.CharField(max_length=16, blank=True)

    insurance_provider = models.CharField(max_length=200, blank=True)
    insurance_number = models.CharField(max_length=100, blank=True)

    
    id_proof_type = models.CharField(
        max_length=30,
        choices=IdProofType.choices,
        blank=True,
    )

    id_proof_number = models.CharField(max_length=100, blank=True)

    id_proof_document = models.FileField(
        upload_to="patients/id_proofs/",
        null=True,
        blank=True,
    )

   
    email_verified = models.BooleanField(default=False)
    mobile_verified = models.BooleanField(default=False)

   
    is_archived = models.BooleanField(default=False)

    archived_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    archived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="archived_patients",
    )

    archive_reason = models.TextField(blank=True)

    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["branch", "is_archived"]),
            models.Index(fields=["is_archived", "created_at"]),
            models.Index(fields=["assigned_doctor"]),
        ]

    @property
    def full_name(self):
        return " ".join(
            part.strip()
            for part in (
                self.first_name,
                self.middle_name,
                self.last_name,
            )
            if part and part.strip()
        )

    @property
    def registration_complete(self):
        required_fields = [
            self.first_name,
            self.last_name,
            self.date_of_birth,
            self.gender,
            self.email,
            self.mobile_number,
            self.address_line,
            self.city,
            self.state,
            self.postal_code,
            self.branch_id,
        ]

        return all(
            value is not None and (
                not isinstance(value, str) or bool(value.strip())
            )
            for value in required_fields
        )

    def __str__(self):
        return f"{self.full_name} ({self.patient_id})"
