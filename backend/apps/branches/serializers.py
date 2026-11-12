from rest_framework import serializers
from .models import Branch


class BranchSerializer(serializers.ModelSerializer):

    hospital_name = serializers.ReadOnlyField(
        source="hospital.name"
    )

    class Meta:
        model = Branch

        fields = [
            "id",
            "hospital",
            "hospital_name",
            "name",
            "branch_code",
            "phone",
            "email",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "hospital_name",
            "created_at",
            "updated_at",
        ]

    # =====================================================
    # BRANCH CODE
    # =====================================================

    def validate_branch_code(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Branch code is required."
            )

        queryset = Branch.objects.filter(
            branch_code__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Branch code already exists."
            )

        return value

    # =====================================================
    # EMAIL
    # =====================================================

    def validate_email(self, value):
        if not value:
            return value

        return value.strip().lower()

    # =====================================================
    # PHONE
    # =====================================================

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