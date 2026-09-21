from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Hospital
from .serializers import HospitalSerializer
from .permissions import IsSuperUserOrHospitalAdmin


class HospitalListCreateView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsSuperUserOrHospitalAdmin
    ]

    # =========================
    # GET - Hospital List
    # =========================

    def get(self, request):

        user = request.user

        if user.role == "SUPER_USER":

            hospitals = Hospital.objects.select_related(
                "created_by"
            ).all()

        elif user.role == "HOSPITAL_ADMIN":

            if not user.hospital_id:
                return Response(
                    {
                        "success": False,
                        "message": "You are not assigned to any hospital."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            hospitals = Hospital.objects.select_related(
                "created_by"
            ).filter(
                id=user.hospital_id
            )

        else:

            return Response(
                {
                    "success": False,
                    "message": "You do not have permission."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = HospitalSerializer(
            hospitals,
            many=True
        )

        return Response(
            {
                "success": True,
                "count": hospitals.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    # =========================
    # POST - Create Hospital
    # =========================

    def post(self, request):

        if request.user.role != "SUPER_USER":

            return Response(
                {
                    "success": False,
                    "message": "Only Super User can create a hospital."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = HospitalSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        hospital = serializer.save(
            created_by=request.user
        )

        return Response(
            {
                "success": True,
                "message": "Hospital created successfully.",
                "data": HospitalSerializer(hospital).data
            },
            status=status.HTTP_201_CREATED
        )


class HospitalDetailView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsSuperUserOrHospitalAdmin
    ]

    # =========================
    # GET - Hospital Detail
    # =========================

    def get(self, request, hospital_id):

        try:
            hospital = Hospital.objects.select_related(
                "created_by"
            ).get(
                id=hospital_id
            )

        except Hospital.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Hospital not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Hospital Admin can only see own hospital
        if (
            request.user.role == "HOSPITAL_ADMIN"
            and request.user.hospital_id != hospital.id
        ):

            return Response(
                {
                    "success": False,
                    "message": "You do not have permission to access this hospital."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = HospitalSerializer(hospital)

        return Response(
            {
                "success": True,
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    # =========================
    # PATCH - Update Hospital
    # =========================

    def patch(self, request, hospital_id):

        if request.user.role != "SUPER_USER":

            return Response(
                {
                    "success": False,
                    "message": "Only Super User can update a hospital."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            hospital = Hospital.objects.get(
                id=hospital_id
            )

        except Hospital.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Hospital not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = HospitalSerializer(
            hospital,
            data=request.data,
            partial=True
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "success": True,
                "message": "Hospital updated successfully.",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    # =========================
    # DELETE - Hospital
    # =========================

    def delete(self, request, hospital_id):

        if request.user.role != "SUPER_USER":

            return Response(
                {
                    "success": False,
                    "message": "Only Super User can delete a hospital."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            hospital = Hospital.objects.get(
                id=hospital_id
            )

        except Hospital.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Hospital not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        hospital.delete()

        return Response(
            {
                "success": True,
                "message": "Hospital deleted successfully."
            },
            status=status.HTTP_204_NO_CONTENT
        )