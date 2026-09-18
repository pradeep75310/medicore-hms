from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.hospitals.models import Hospital
from .models import Nurse


class NurseAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hospital = Hospital.objects.create(
            name="Teaching Hospital",
            phone="01-4412345",
            email="info@teachinghospital.edu.np",
            address="Maharajgunj",
            city="Kathmandu"
        )
        self.nurse = Nurse.objects.create(
            hospital=self.hospital,
            first_name="Sita",
            last_name="Shrestha",
            department="Emergency",
            qualification="B.Sc. Nursing",
            shift="Morning",
            assigned_ward="Ward A",
            phone="9842000000",
            email="sita.shrestha@example.com",
            experience_years=4,
            is_active=True
        )

    def test_list_nurses(self):
        response = self.client.get('/api/nurses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['full_name'], "Sita Shrestha")

    def test_create_nurse(self):
        payload = {
            "hospital": self.hospital.id,
            "first_name": "Gita",
            "last_name": "Rai",
            "department": "ICU",
            "qualification": "PCL Nursing",
            "shift": "Night",
            "assigned_ward": "ICU Ward 2",
            "phone": "9842111111",
            "email": "gita.rai@example.com",
            "experience_years": 3,
            "is_active": True
        }
        response = self.client.post('/api/nurses/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Nurse.objects.count(), 2)

    def test_filter_by_shift(self):
        response = self.client.get('/api/nurses/?shift=Morning')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        response = self.client.get('/api/nurses/?shift=Night')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_shifts_endpoint(self):
        response = self.client.get('/api/nurses/shifts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Morning", response.data)
        self.assertIn("Evening", response.data)
        self.assertIn("Night", response.data)
        self.assertIn("Rotational", response.data)
