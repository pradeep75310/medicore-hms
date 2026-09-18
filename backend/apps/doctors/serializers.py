from rest_framework import serializers
from .models import Doctor
from apps.hospitals.models import Hospital


class DoctorSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    hospital_name = serializers.ReadOnlyField(source='hospital.name')
    # Support backward-compatibility write field 'name' if provided
    name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Doctor
        fields = [
            'id',
            'hospital',
            'hospital_name',
            'first_name',
            'last_name',
            'name',
            'full_name',
            'license_number',
            'specialization',
            'qualification',
            'department',
            'phone',
            'email',
            'experience_years',
            'consultation_fee',
            'bio',
            'room_number',
            'available_days',
            'is_available',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_name', 'hospital_name']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate(self, attrs):
        # Handle 'name' string if first_name/last_name were not passed
        if 'name' in attrs:
            name_val = attrs.pop('name')
            if name_val and ('first_name' not in attrs or not attrs['first_name']):
                parts = name_val.strip().split(' ', 1)
                attrs['first_name'] = parts[0]
                if len(parts) > 1 and 'last_name' not in attrs:
                    attrs['last_name'] = parts[1]
                elif 'last_name' not in attrs:
                    attrs['last_name'] = ''
        if 'first_name' not in attrs and not self.instance:
            raise serializers.ValidationError({"first_name": "First name or name is required."})
        return attrs
