import uuid

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
        editable=False,
        unique=True,
    )

    # Personal information
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(
        max_length=100,
        blank=True,
    )
    last_name = models.CharField(max_length=100)

    date_of_birth = models.DateField()
    gender = models.CharField(
        max_length=30,
        choices=Gender.choices,
    )

    # Contact information
    email = models.EmailField(unique=True)
    mobile_number = models.CharField(
        max_length=15,
        unique=True,
    )

    # Address
    address_line = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=10)
    country = models.CharField(
        max_length=100,
        default="India",
    )

    # Identification
    id_proof_type = models.CharField(
        max_length=30,
        choices=IdProofType.choices,
    )
    id_proof_number = models.CharField(max_length=100)

    id_proof_document = models.FileField(
        upload_to="patients/id_proofs/",
        blank=True,
        null=True,
    )

    # Verification status
    email_verified = models.BooleanField(default=False)
    mobile_verified = models.BooleanField(default=False)

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.patient_id})"