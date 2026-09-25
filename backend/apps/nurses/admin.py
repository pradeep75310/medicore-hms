from django.contrib import admin
from .models import Nurse


@admin.register(Nurse)
class NurseAdmin(admin.ModelAdmin):
    list_display = (
        'full_name',
        'department',
        'shift',
        'assigned_ward',
        'branch',
        'phone',
        'email',
        'is_active',
        'created_at'
    )
    list_filter = ('shift', 'department', 'branch', 'is_active')
    search_fields = ('first_name', 'last_name', 'department', 'assigned_ward', 'license_number', 'email', 'phone')
    ordering = ('-created_at',)
