from django.contrib.auth.models import BaseUserManager


class CustomUserManager(BaseUserManager):
    # this function for create normal a user = Users.objects.create_user(username=username, password=password)
    def create_user(
        self,
        username,
        email,
        password=None,
        **extra_fields
    ):
        if not email:
            raise ValueError("Email is Required")
        
        if not username:
            raise ValueError("username is required")
        
        email = self.normalize_email(email)
        
        user = self.model(
            username=username,
            email=email,
            **extra_fields
        )
        
        user.set_password(password)
        user.save(using=self._db)
        
        return user
    
    # this function is use when create a suparuser
    def create_superuser(
        self,
        username,
        email,
        password=None,
        **extra_fields
    ):
        extra_fields.setdefault("is_staff", True),
        extra_fields.setdefault("is_superuser", True),
        extra_fields.setdefault("is_active", True),
        extra_fields.setdefault("is_email_verified", True), 
        extra_fields.setdefault("is_approved", True),
        extra_fields.setdefault("role", "SUPER_USER"),
        
        if extra_fields.get("is_staff") is not True:
            raise ValueError("superuser must is_staff is True")
        
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("superuser must have is_superuser is True ")
        
        return self.create_user(
            username=username,
            email=email,
            password=password,
            **extra_fields
        )
        
        