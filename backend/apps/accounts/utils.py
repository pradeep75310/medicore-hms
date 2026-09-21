import random
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from .models import EmailOTP


def generate_otp():
    return str(random.randint(100000, 999999))


def send_otp(email, purpose):

    otp = generate_otp()

    EmailOTP.objects.filter(
        email=email,
        purpose=purpose,
        is_verified=False
    ).delete()

    EmailOTP.objects.create(
        email=email,
        otp_hash=make_password(otp),
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=10)
    )

    send_mail(
        subject="HMS Email Verification OTP",
        message=(
            f"Your Hospital Management System OTP is: {otp}\n\n"
            "This OTP is valid for 10 minutes.\n"
            "Do not share this OTP with anyone."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False
    )

    return True