from django.contrib import admin

from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "patient_id",
        "first_name",
        "last_name",
        "email",
        "mobile_number",
        "gender",
        "date_of_birth",
        "email_verified",
        "mobile_verified",
        "created_at",
    )

    search_fields = (
        "patient_id",
        "first_name",
        "middle_name",
        "last_name",
        "email",
        "mobile_number",
    )

    list_filter = (
        "gender",
        "email_verified",
        "mobile_verified",
        "created_at",
    )

    readonly_fields = (
        "patient_id",
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)