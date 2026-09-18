from rest_framework import serializers
from .models import Nurse


class NurseSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    hospital_name = serializers.ReadOnlyField(source='hospital.name')
    # Backward compatibility write field 'name'
    name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Nurse
        fields = [
            'id',
            'hospital',
            'hospital_name',
            'first_name',
            'last_name',
            'name',
            'full_name',
            'license_number',
            'department',
            'qualification',
            'shift',
            'assigned_ward',
            'phone',
            'email',
            'experience_years',
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
