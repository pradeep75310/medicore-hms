from django.contrib import admin
from .models import Doctor


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = (
        'full_name',
        'specialization',
        'department',
        'branch',
        'phone',
        'email',
        'is_available',
        'is_active',
        'created_at'
    )
    list_filter = ('specialization', 'department', 'branch', 'is_available', 'is_active')
    search_fields = ('first_name', 'last_name', 'specialization', 'license_number', 'email', 'phone')
    ordering = ('-created_at',)
