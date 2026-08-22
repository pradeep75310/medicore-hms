from rest_framework import viewsets

from .models import Patient
from .serializers import PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing patients.

    Supports:
    - List patients
    - Retrieve a patient
    - Create a patient
    - Update a patient
    - Delete a patient
    """

    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    lookup_field = "patient_id"