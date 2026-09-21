# from django.contrib import admin
# from .models import Hospital

# Register your models here.

# admin.site.register(Hospital)
from django.contrib import admin
from .models import Hospital


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "hospital_code",
        "hospital_type",
        "city",
        "state",
        "status",
        "created_by",
        "created_at",
    )

    list_filter = (
        "hospital_type",
        "status",
        "state",
        "city",
    )

    search_fields = (
        "name",
        "legal_name",
        "hospital_code",
        "registration_number",
        "email",
        "phone",
    )

    readonly_fields = (
        "created_by",
        "created_at",
        "updated_at",
    )

    ordering = (
        "-created_at",
    )