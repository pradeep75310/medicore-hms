from datetime import date

from rest_framework import serializers

from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = (
            "patient_id",
            "first_name",
            "middle_name",
            "last_name",
            "date_of_birth",
            "gender",
            "email",
            "mobile_number",
            "address_line",
            "city",
            "state",
            "postal_code",
            "country",
            "id_proof_type",
            "id_proof_number",
            "id_proof_document",
            "email_verified",
            "mobile_verified",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "patient_id",
            "email_verified",
            "mobile_verified",
            "created_at",
            "updated_at",
        )

    def validate_date_of_birth(self, value):
        """Prevent future dates of birth."""
        if value > date.today():
            raise serializers.ValidationError(
                "Date of birth cannot be in the future."
            )

        return value

    def validate_mobile_number(self, value):
        """Basic validation for an Indian/international mobile number."""
        cleaned_value = value.strip()

        if not cleaned_value.replace("+", "").isdigit():
            raise serializers.ValidationError(
                "Mobile number must contain only digits and an optional leading '+'."
            )

        if len(cleaned_value.replace("+", "")) < 10:
            raise serializers.ValidationError(
                "Mobile number must contain at least 10 digits."
            )

        return cleaned_value