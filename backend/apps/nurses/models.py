from django.db import models
from django.utils import timezone
from apps.hospitals.models import Hospital


class Nurse(models.Model):
    SHIFT_CHOICES = [
        ('Morning', 'Morning'),
        ('Evening', 'Evening'),
        ('Night', 'Night'),
        ('Rotational', 'Rotational'),
    ]

    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='nurses',
        null=True,
        blank=True
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    license_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    qualification = models.CharField(max_length=200, blank=True)
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, default='Morning')
    assigned_ward = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30)
    email = models.EmailField()
    experience_years = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Nurse'
        verbose_name_plural = 'Nurses'

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def name(self):
        """Getter for backward compatibility with code expecting nurse.name"""
        return f"{self.first_name} {self.last_name}".strip()

    @name.setter
    def name(self, value):
        """Setter for backward compatibility"""
        if value:
            parts = value.strip().split(' ', 1)
            self.first_name = parts[0]
            self.last_name = parts[1] if len(parts) > 1 else ''

    def __str__(self):
        return f"{self.full_name} ({self.department or 'Nurse'})"