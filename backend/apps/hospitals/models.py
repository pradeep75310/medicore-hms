
from django.db import models
from django.conf import settings


class Hospital(models.Model):

    HOSPITAL_TYPE_CHOICES = (
        ("PRIVATE", "Private"),
        ("GOVERNMENT", "Government"),
        ("TRUST", "Trust"),
        ("CORPORATE", "Corporate"),
        ("OTHER", "Other"),
    )

    STATUS_CHOICES = (
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
        ("SUSPENDED", "Suspended"),
    )

    # =========================
    # Basic Information
    # =========================

    name = models.CharField(
        max_length=200
    )

    legal_name = models.CharField(
        max_length=250,
        blank=True,
        null=True
    )

    hospital_code = models.CharField(
        max_length=50,
        unique=True
    )

    hospital_type = models.CharField(
        max_length=20,
        choices=HOSPITAL_TYPE_CHOICES,
        default="PRIVATE"
    )

    registration_number = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True
    )

    # =========================
    # Contact Information
    # =========================

    email = models.EmailField(
        blank=True,
        null=True
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    alternate_phone = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    website = models.URLField(
        blank=True,
        null=True
    )

    # =========================
    # Address
    # =========================

    address_line_1 = models.CharField(
    max_length=255,
)


    address_line_2 = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    city = models.CharField(
    max_length=100,
    
)

    state = models.CharField(
    max_length=100,
    
)

    postal_code = models.CharField(
    max_length=10,
    
)
    # =========================
    # Hospital Details
    # =========================

    established_date = models.DateField(
        blank=True,
        null=True
    )

    logo = models.ImageField(
        upload_to="hospitals/logos/",
        blank=True,
        null=True
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    # =========================
    # Status
    # =========================

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ACTIVE"
    )

    # =========================
    # Audit Information
    # =========================

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_hospitals"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["hospital_code"]),
            models.Index(fields=["status"]),
            models.Index(fields=["city"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.hospital_code})"
