from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import CustomUserManager

# Create your models here.

class User (AbstractUser):
    ROLE_CHOICES = (
        ("SUPER_USER", "Super User"),
        ("HOSPITAL_ADMIN", "Hospital Admin"),
        ("DOCTOR", "Doctor"),
        ("NURSE", "Nurse"),
        ("LAB_TECHNICIAN", "Lab Technician"),
        ("PHARMACIST", "Pharmacist"),
        ("ACCOUNTANT", "Accountant"),
        ("RECEPTIONIST", "Receptionist"),
        ("PATIENT", "Patient"),
    )
    
    email = models.EmailField(unique=True)
    
    role = models.CharField(max_length=30, choices=ROLE_CHOICES , default="PATIENT")
    hospital = models.ForeignKey("hospitals.Hospital" , on_delete=models.SET_NULL , null=True , blank=True , related_name="users")
    branch = models.ForeignKey("branches.Branch" , on_delete=models.SET_NULL , null=True , blank=True , related_name="users")
    department = models.ForeignKey("departments.Department" , on_delete=models.SET_NULL , null=True , blank=True , related_name="users")
    phone = models.CharField(max_length=15 , unique=True , null=True , blank=True)
    profile_image = models.ImageField(upload_to="profiles/" , null=True , blank=True)
    is_approved = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = CustomUserManager()
    
    def __str__(self):
        return f"{self.username} - {self.role}"
    
    
class EmailOTP(models.Model):
    PURPOSE_CHOICES = (
        ("SUPERUSER_REGISTER", "Super User Registration"),
        ("PATIENT_REGISTER", "Patient Registration"),
        ("FORGOT_PASSWORD", "Forgot Password"),
         ("HOSPITAL_ADMIN",  "Hospital Admin"),  
    )    
    
    email = models.EmailField()
    otp_hash = models.CharField(max_length=128)
    purpose = models.CharField(max_length=30 , choices=PURPOSE_CHOICES)
    attempts = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    def __str__(self):
        return f"{self.email} - {self.purpose}" 
    
    

