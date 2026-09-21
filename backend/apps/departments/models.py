from django.db import models

# Create your models here.

class Department(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    hospital = models.ForeignKey("hospitals.Hospital", on_delete=models.CASCADE, related_name="branches")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name