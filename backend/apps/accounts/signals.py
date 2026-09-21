from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User


@receiver(post_save, sender=User)
def create_role_profile(
    sender,
    instance,
    created,
    **kwargs
):
    if not created:
        return
    if instance.role == "DOCTOR":
        from doctors.models import DoctorProfile
        DoctorProfile.objects.create(
            user=instance
        )
    elif instance.role == "NURSE":
        from nurses.models import NurseProfile
        NurseProfile.objects.create(
            user=instance
        )

    elif instance.role == "LAB_TECHNICIAN":
        from laboratory.models import LabTechnicianProfile
        LabTechnicianProfile.objects.create(
            user=instance
        )

    elif instance.role == "PHARMACIST":
        from pharmacy.models import PharmacistProfile
        PharmacistProfile.objects.create(
            user=instance
        )
    elif instance.role == "ACCOUNTANT":
        from accounting.models import AccountantProfile
        AccountantProfile.objects.create(
            user=instance
        )
    elif instance.role == "RECEPTIONIST":
        from receptionist.models import ReceptionistProfile
        ReceptionistProfile.objects.create(
            user=instance
        )