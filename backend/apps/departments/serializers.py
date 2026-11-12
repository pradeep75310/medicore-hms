from rest_framework import serializers

from .models import Department




class DepartmentSerializer(serializers.ModelSerializer):

    branch_name = serializers.ReadOnlyField(
        source="branch.name"
    )

    hospital_name = serializers.ReadOnlyField(
        source="branch.hospital.name"
    )

    class Meta:
        model = Department

        fields = [
            "id",
            "branch",
            "branch_name",
            "hospital_name",
            "name",
            "code",
            "description",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "branch_name",
            "hospital_name",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Department name is required."
            )

        return value

    def validate_code(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Department code is required."
            )

        return value

    def validate(self, attrs):
        branch = attrs.get(
            "branch",
            getattr(self.instance, "branch", None)
        )

        code = attrs.get(
            "code",
            getattr(self.instance, "code", "")
        )

        if branch and code:
            queryset = Department.objects.filter(
                branch=branch,
                code__iexact=code
            )

            if self.instance:
                queryset = queryset.exclude(
                    pk=self.instance.pk
                )

            if queryset.exists():
                raise serializers.ValidationError({
                    "code": (
                        "This department code already exists "
                        "in the selected branch."
                    )
                })

        return attrs
