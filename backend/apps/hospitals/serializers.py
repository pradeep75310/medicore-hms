from rest_framework import serializers
from .models import Hospital


class HospitalSerializer(serializers.ModelSerializer):

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    hospital_type_name = serializers.CharField(
        source="get_hospital_type_display",
        read_only=True
    )

    status_name = serializers.CharField(
        source="get_status_display",
        read_only=True
    )

    class Meta:
        model = Hospital

        fields = [
            "id",

            # Basic Information
            "name",
            "legal_name",
            "hospital_code",
            "hospital_type",
            "hospital_type_name",
            "registration_number",

            # Contact
            "email",
            "phone",
            "alternate_phone",
            "website",

            # Address
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "postal_code",

            # Details
            "established_date",
            "logo",
            "description",

            # Status
            "status",
            "status_name",

            # Audit
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_by_name",
            "hospital_type_name",
            "status_name",
            "created_at",
            "updated_at",
        ]

    # -------------------------
    # Hospital Code Validation
    # -------------------------

    def validate_hospital_code(self, value):
        value = value.strip().upper()

        queryset = Hospital.objects.filter(
            hospital_code__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Hospital code already exists."
            )

        return value

    # -------------------------
    # Registration Number
    # -------------------------

    def validate_registration_number(self, value):

        if not value:
            return value

        value = value.strip().upper()

        queryset = Hospital.objects.filter(
            registration_number__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Registration number already exists."
            )

        return value

    # -------------------------
    # Email
    # -------------------------

    def validate_email(self, value):

        if not value:
            return value

        return value.strip().lower()

    # -------------------------
    # Phone
    # -------------------------

    def validate_phone(self, value):

        if not value:
            return value

        value = value.strip()

        if not value.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only digits."
            )

        if len(value) < 10 or len(value) > 15:
            raise serializers.ValidationError(
                "Phone number must be between 10 and 15 digits."
            )

        return value

    # -------------------------
    # Alternate Phone
    # -------------------------

    def validate_alternate_phone(self, value):

        if not value:
            return value

        value = value.strip()

        if not value.isdigit():
            raise serializers.ValidationError(
                "Alternate phone must contain only digits."
            )

        if len(value) < 10 or len(value) > 15:
            raise serializers.ValidationError(
                "Alternate phone must be between 10 and 15 digits."
            )

        return value