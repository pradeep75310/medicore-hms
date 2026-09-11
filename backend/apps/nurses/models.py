from django.db import models


class Nurse(models.Model):
    name = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField()