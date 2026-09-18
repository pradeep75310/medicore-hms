from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.hospitals.models import Hospital
from .models import Doctor


class DoctorAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hospital = Hospital.objects.create(
            name="Teaching Hospital",
            phone="01-4412345",
            email="info@teachinghospital.edu.np",
            address="Maharajgunj",
            city="Kathmandu"
        )
        self.doctor = Doctor.objects.create(
            hospital=self.hospital,
            first_name="Sandesh",
            last_name="Sharma",
            specialization="Cardiology",
            qualification="MBBS, MD Cardiology",
            department="Cardiology",
            phone="9841000000",
            email="sandesh.sharma@example.com",
            experience_years=8,
            consultation_fee=1000.00,
            is_available=True,
            is_active=True
        )

    def test_list_doctors(self):
        response = self.client.get('/api/doctors/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['full_name'], "Dr. Sandesh Sharma")

    def test_create_doctor(self):
        payload = {
            "hospital": self.hospital.id,
            "first_name": "Ramesh",
            "last_name": "Adhikari",
            "specialization": "Neurology",
            "qualification": "MBBS, MS",
            "department": "Neurology",
            "phone": "9841111111",
            "email": "ramesh.adhikari@example.com",
            "experience_years": 5,
            "consultation_fee": "800.00",
            "is_available": True,
            "is_active": True
        }
        response = self.client.post('/api/doctors/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Doctor.objects.count(), 2)

    def test_filter_by_specialization(self):
        response = self.client.get('/api/doctors/?specialization=Cardiology')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        response = self.client.get('/api/doctors/?specialization=Orthopedic')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_available_doctors_endpoint(self):
        response = self.client.get('/api/doctors/available/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_specializations_endpoint(self):
        response = self.client.get('/api/doctors/specializations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Cardiology", response.data)
