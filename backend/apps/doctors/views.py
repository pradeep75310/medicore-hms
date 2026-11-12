from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated

from .models import DoctorProfile
from .serializers import DoctorSerializer
from apps.accounts.permissions import IsSuperUserOrHospitalAdmin


class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "user__username",
        "user__first_name",
        "user__last_name",
        "user__email",
        "specialization",
        "registration_number",
    ]
    ordering_fields = ["created_at", "experience_years", "consultation_fee"]
    ordering = ["user__first_name"]

    def get_queryset(self):
        queryset = DoctorProfile.objects.select_related(
            "user",
            "user__hospital",
            "user__branch",
            "user__department",
        ).all()

        user = self.request.user

        if user.role == "SUPER_USER" or user.is_superuser:
            pass
        elif user.role == "HOSPITAL_ADMIN":
            queryset = queryset.filter(user__hospital_id=user.hospital_id)
        elif user.role == "DOCTOR":
            queryset = queryset.filter(user=user)
        else:
            queryset = queryset.none()

        user_id = self.request.query_params.get("user_id")
        if user_id:
            queryset = queryset.filter(user_id=user_id)    

        branch_id = self.request.query_params.get("branch")
        if branch_id:
            queryset = queryset.filter(user__branch_id=branch_id)

        specialization = self.request.query_params.get("specialization")
        if specialization:
            queryset = queryset.filter(
                specialization__icontains=specialization
            )

        return queryset

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [IsAuthenticated()]

        return [IsAuthenticated(), IsSuperUserOrHospitalAdmin()]

    def create(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status

        

        return Response(
            {
                "detail": (
                    "Create the doctor account through "
                    "/accounts/staff/create/ first. The DoctorProfile "
                    "is created automatically; then update this profile."
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def perform_destroy(self, instance):
        instance.user.delete()

    def perform_update(self, serializer):
        instance = serializer.save()

        uploaded_image = self.request.FILES.get("profile_image")
        if uploaded_image:
            instance.user.profile_image = uploaded_image
            instance.user.save(update_fields=["profile_image"])    