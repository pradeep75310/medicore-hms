from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import User
from apps.patients.models import Patient
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(
            role="DOCTOR",
            is_active=True,
            is_approved=True,
        ),
        required=False,
        allow_null=True,
    )

    patient_name = serializers.CharField(
        source="patient.full_name",
        read_only=True,
    )
    patient_number = serializers.CharField(
        source="patient.patient_id",
        read_only=True,
    )
    doctor_name = serializers.SerializerMethodField()
    doctor_email = serializers.EmailField(
        source="doctor.email",
        read_only=True,
    )
    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True,
    )
    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
        default="",
    )
    booked_by_name = serializers.SerializerMethodField()
    ends_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "appointment_number",
            "patient",
            "patient_name",
            "patient_number",
            "doctor",
            "doctor_name",
            "doctor_email",
            "branch",
            "branch_name",
            "department",
            "department_name",
            "appointment_type",
            "status",
            "scheduled_at",
            "ends_at",
            "duration_minutes",
            "reason",
            "symptoms",
            "patient_notes",
            "clinical_notes",
            "cancellation_reason",
            "cancelled_at",
            "cancelled_by",
            "booked_by",
            "booked_by_name",
            "rescheduled_from",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "appointment_number",
            "status",
            "cancelled_at",
            "cancelled_by",
            "booked_by",
            "rescheduled_from",
            "created_at",
            "updated_at",
            "clinical_notes",
        ]

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name().strip() or obj.doctor.username

    def get_booked_by_name(self, obj):
        if not obj.booked_by:
            return ""
        return obj.booked_by.get_full_name().strip() or obj.booked_by.username

    def _actor(self):
        request = self.context.get("request")
        return getattr(request, "user", None)

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        instance = getattr(self, "instance", None)

        patient = attrs.get(
            "patient",
            getattr(instance, "patient", None),
        )
        doctor = attrs.get(
            "doctor",
            getattr(instance, "doctor", None),
        )
        branch = attrs.get(
            "branch",
            getattr(instance, "branch", None),
        )
        department = attrs.get(
            "department",
            getattr(instance, "department", None),
        )
        scheduled_at = attrs.get(
            "scheduled_at",
            getattr(instance, "scheduled_at", None),
        )
        duration = attrs.get(
            "duration_minutes",
            getattr(instance, "duration_minutes", 30),
        )

        if duration < 5 or duration > 240:
            raise serializers.ValidationError({
                "duration_minutes": "Duration must be between 5 and 240 minutes."
            })

        if patient and patient.is_archived:
            raise serializers.ValidationError({
                "patient": "Archived patients cannot have appointments."
            })

        if branch and branch.status != "ACTIVE":
            raise serializers.ValidationError({
                "branch": "Select an active branch."
            })

        if department:
            if department.status != "ACTIVE":
                raise serializers.ValidationError({
                    "department": "Select an active department."
                })

            if not department.branch_id or department.branch_id != branch.id:
                raise serializers.ValidationError({
                    "department": "Department must belong to the selected branch."
                })
        if not doctor and not instance and branch:
            doctors = User.objects.filter(
                role="DOCTOR",
                is_active=True,
                is_approved=True,
                branch_id=branch.id,
                hospital_id=branch.hospital_id,
            )

            if department:
                doctors = doctors.filter(
                    department_id=department.id
                )

            doctor = doctors.order_by("id").first()

            if not doctor:
                raise serializers.ValidationError({
                    "doctor": (
                        "No approved, active doctor is available "
                        "for the selected branch and department."
                    )
                })

            attrs["doctor"] = doctor

        if not doctor:
            raise serializers.ValidationError({
                "doctor": "A doctor is required for this appointment."
            })

        if doctor.role != "DOCTOR":
            raise serializers.ValidationError({
                "doctor": "Selected user is not a doctor."
            })

        if not doctor.is_active or not doctor.is_approved:
            raise serializers.ValidationError({
                "doctor": "The selected doctor must be active and approved."
            })

        if branch:
            if not doctor.branch_id or doctor.branch_id != branch.id:
                raise serializers.ValidationError({
                    "doctor": "Doctor must be assigned to the selected branch."
                })

            if doctor.hospital_id != branch.hospital_id:
                raise serializers.ValidationError({
                    "doctor": "Doctor hospital must match the selected branch hospital."
                })

            if department and doctor.department_id != department.id:
                raise serializers.ValidationError({
                    "doctor": "Doctor must belong to the selected department."
                })

        if patient and branch and patient.branch_id:
            patient_hospital_id = patient.branch.hospital_id

            if patient_hospital_id != branch.hospital_id:
                raise serializers.ValidationError({
                    "branch": "Choose a branch from your registered hospital."
                })

        if (
            scheduled_at
            and scheduled_at <= timezone.now()
            and not instance
        ):
            raise serializers.ValidationError({
                "scheduled_at": "Appointment must be scheduled in the future."
            })
        if scheduled_at and doctor and branch and duration:
            start = scheduled_at
            end = start + timedelta(minutes=duration)

            overlaps = Appointment.objects.filter(
                doctor=doctor,
                status__in=[
                    "PENDING",
                    "CONFIRMED",
                    "CHECKED_IN",
                    "IN_PROGRESS",
                ],
                scheduled_at__lt=end,
                scheduled_at__gt=start - timedelta(minutes=240),
            )

            if instance:
                overlaps = overlaps.exclude(pk=instance.pk)

            for other in overlaps:
                other_end = other.scheduled_at + timedelta(
                    minutes=other.duration_minutes
                )

                if other.scheduled_at < end and other_end > start:
                    raise serializers.ValidationError({
                        "scheduled_at": (
                            "This doctor already has an overlapping appointment."
                        )
                    })

        if actor and actor.role == "PATIENT":
            linked_patient = Patient.objects.filter(
                user=actor
            ).first()

            if not linked_patient or not patient or patient.pk != linked_patient.pk:
                raise serializers.ValidationError({
                    "patient": "Patients can book appointments only for their own profile."
                })

        if actor and actor.role == "DOCTOR" and doctor.pk != actor.pk:
            raise serializers.ValidationError({
                "doctor": "Doctors can create appointments only for themselves."
            })

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        actor = getattr(request, "user", None)

        if actor and actor.role == "PATIENT":
            patient = Patient.objects.filter(user=actor).first()

            if not patient:
                raise serializers.ValidationError({
                    "patient": "Patient profile not found."
                })

            validated_data["patient"] = patient

        if actor:
            validated_data["booked_by"] = actor

        return super().create(validated_data)


class AppointmentRescheduleSerializer(serializers.Serializer):
    scheduled_at = serializers.DateTimeField()

    duration_minutes = serializers.IntegerField(
        required=False,
        min_value=5,
        max_value=240,
    )

    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )

    def validate_scheduled_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError(
                "New appointment time must be in the future."
            )
        return value


class AppointmentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=Appointment._meta.get_field("status").choices
    )
