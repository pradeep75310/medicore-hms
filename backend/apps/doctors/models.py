from django.db import models
from django.utils import timezone
from apps.hospitals.models import Hospital


class Doctor(models.Model):
    hospital = models.ForeignKey(
        Hospital, 
        on_delete=models.CASCADE, 
        related_name='doctors',
        null=True, 
        blank=True
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    license_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    specialization = models.CharField(max_length=150)
    qualification = models.CharField(max_length=200, blank=True)
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30)
    email = models.EmailField()
    experience_years = models.PositiveIntegerField(default=0)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    bio = models.TextField(blank=True)
    room_number = models.CharField(max_length=50, blank=True)
    available_days = models.CharField(
        max_length=255, 
        default='Monday, Tuesday, Wednesday, Thursday, Friday',
        blank=True,
        help_text="Comma-separated available days"
    )
    is_available = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'

    @property
    def full_name(self):
        return f"Dr. {self.first_name} {self.last_name}".strip()

    @property
    def name(self):
        """Getter for backward compatibility with code expecting doctor.name"""
        return f"{self.first_name} {self.last_name}".strip()

    @name.setter
    def name(self, value):
        """Setter for backward compatibility"""
        if value:
            parts = value.strip().split(' ', 1)
            self.first_name = parts[0]
            self.last_name = parts[1] if len(parts) > 1 else ''

    def __str__(self):
        return f"{self.full_name} ({self.specialization})"