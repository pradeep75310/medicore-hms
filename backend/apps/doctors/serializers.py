from rest_framework import serializers
from .models import DoctorProfile


class DoctorSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    profile_image = serializers.SerializerMethodField()

    hospital_id = serializers.IntegerField(source="user.hospital_id", read_only=True)
    branch_id = serializers.IntegerField(source="user.branch_id", read_only=True)
    department_id = serializers.IntegerField(source="user.department_id", read_only=True)

    hospital_name = serializers.CharField(
        source="user.hospital.name", read_only=True, default=""
    )
    branch_name = serializers.CharField(
        source="user.branch.name", read_only=True, default=""
    )
    department_name = serializers.CharField(
        source="user.department.name", read_only=True, default=""
    )
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)

    class Meta:
        model = DoctorProfile
        fields = [
            "id", "user_id", "username", "first_name", "last_name",
            "full_name", "email", "phone", "profile_image",
            "hospital_id", "hospital_name",
            "branch_id", "branch_name",
            "department_id", "department_name",
            "specialization", "qualification", "registration_number",
            "experience_years", "consultation_fee", "bio",
            "available_from", "available_to", "is_available",
            "degree_certificate", "experience_letter", "identity_document",
            "registration_status", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "user_id", "username", "first_name", "last_name",
            "full_name", "email", "phone", "profile_image",
            "hospital_id", "hospital_name", "branch_id", "branch_name",
            "department_id", "department_name", "is_active",
            "created_at", "updated_at",
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_profile_image(self, obj):
        request = self.context.get("request")
        image = getattr(obj.user, "profile_image", None)

        if not image:
            return None

        try:
            url = image.url
            return request.build_absolute_uri(url) if request else url
        except (ValueError, AttributeError):
            return None

    def validate(self, attrs):
        instance = self.instance

        registration_number = attrs.get(
            "registration_number",
            getattr(instance, "registration_number", ""),
        )
        specialization = attrs.get(
            "specialization",
            getattr(instance, "specialization", ""),
        )
        qualification = attrs.get(
            "qualification",
            getattr(instance, "qualification", ""),
        )
        if registration_number and specialization and qualification:
            attrs["registration_status"] = "COMPLETED"
        else:
            attrs["registration_status"] = "PENDING"

        return attrs