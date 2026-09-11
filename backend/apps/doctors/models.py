from django.db import models


class Doctor(models.Model):
    name = models.CharField(max_length=200)
    specialization = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField()