import uuid

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Patient
from .serializers import PatientSerializer


def patient_data(**overrides):
    data = {
        "first_name": "Asha",
        "middle_name": "Priya",
        "last_name": "Sharma",
        "date_of_birth": "1990-05-15",
        "gender": Patient.Gender.FEMALE,
        "email": "asha.sharma@example.com",
        "mobile_number": "9876543210",
        "address_line": "12 Main Street",
        "city": "Jaipur",
        "state": "Rajasthan",
        "postal_code": "302001",
        "country": "India",
        "id_proof_type": Patient.IdProofType.AADHAAR,
        "id_proof_number": "123456789012",
    }
    data.update(overrides)
    return data


class PatientSerializerTests(APITestCase):
    def test_required_data_is_validated(self):
        serializer = PatientSerializer(data={})

        self.assertFalse(serializer.is_valid())
        self.assertIn("first_name", serializer.errors)
        self.assertIn("last_name", serializer.errors)
        self.assertIn("date_of_birth", serializer.errors)

    def test_duplicate_email_is_rejected(self):
        Patient.objects.create(**patient_data())
        serializer = PatientSerializer(
            data=patient_data(mobile_number="9876543211"),
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_duplicate_mobile_number_is_rejected(self):
        Patient.objects.create(**patient_data())
        serializer = PatientSerializer(
            data=patient_data(email="another@example.com"),
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("mobile_number", serializer.errors)

    def test_identifiers_and_verification_fields_are_read_only(self):
        patient = Patient.objects.create(**patient_data())
        serializer = PatientSerializer(
            patient,
            data={
                "patient_id": str(uuid.uuid4()),
                "email_verified": True,
                "mobile_verified": True,
            },
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn("patient_id", serializer.validated_data)
        self.assertNotIn("email_verified", serializer.validated_data)
        self.assertNotIn("mobile_verified", serializer.validated_data)


class PatientAPITests(APITestCase):
    list_url = "/api/patients/"

    def setUp(self):
        self.user = User.objects.create_user(
            username="patient-api-user",
            password="safe-test-password",
        )
        self.patient = Patient.objects.create(**patient_data())

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def test_unauthenticated_access_is_rejected(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_patient_list_works(self):
        self.authenticate()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["patient_id"], str(self.patient.patient_id))

    def test_authenticated_patient_creation_generates_read_only_patient_id(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            patient_data(
                email="new.patient@example.com",
                mobile_number="9876543211",
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_patient = Patient.objects.get(email="new.patient@example.com")
        self.assertEqual(response.data["patient_id"], str(created_patient.patient_id))
        self.assertIsNotNone(created_patient.patient_id)

    def test_patient_retrieval_works(self):
        self.authenticate()

        response = self.client.get(f"{self.list_url}{self.patient.patient_id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["patient_id"], str(self.patient.patient_id))

    def test_patient_patch_works(self):
        self.authenticate()

        response = self.client.patch(
            f"{self.list_url}{self.patient.patient_id}/",
            {"city": "Udaipur"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.city, "Udaipur")

    def test_patient_deletion_works(self):
        self.authenticate()

        response = self.client.delete(f"{self.list_url}{self.patient.patient_id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Patient.objects.filter(pk=self.patient.pk).exists())

    def test_read_only_fields_cannot_be_changed_through_api(self):
        self.authenticate()
        original_patient_id = self.patient.patient_id

        response = self.client.patch(
            f"{self.list_url}{self.patient.patient_id}/",
            {
                "patient_id": str(uuid.uuid4()),
                "email_verified": True,
                "mobile_verified": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.patient_id, original_patient_id)
        self.assertFalse(self.patient.email_verified)
        self.assertFalse(self.patient.mobile_verified)
