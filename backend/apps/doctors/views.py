from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Doctor
from .serializers import DoctorSerializer


class DoctorViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Doctors with filtering, search, and custom actions.
    """
    queryset = Doctor.objects.select_related('hospital').all()
    serializer_class = DoctorSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'first_name',
        'last_name',
        'specialization',
        'department',
        'license_number',
        'email',
        'phone',
        'hospital__name'
    ]
    ordering_fields = ['first_name', 'specialization', 'experience_years', 'consultation_fee', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Doctor.objects.select_related('hospital').all()
        hospital_id = self.request.query_params.get('hospital')
        specialization = self.request.query_params.get('specialization')
        department = self.request.query_params.get('department')
        is_available = self.request.query_params.get('is_available')
        is_active = self.request.query_params.get('is_active')

        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if specialization:
            queryset = queryset.filter(specialization__icontains=specialization)
        if department:
            queryset = queryset.filter(department__icontains=department)
        if is_available is not None:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all currently available and active doctors"""
        available_doctors = self.get_queryset().filter(is_available=True, is_active=True)
        serializer = self.get_serializer(available_doctors, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def specializations(self, request):
        """List distinct doctor specializations"""
        specs = (
            Doctor.objects.filter(is_active=True)
            .values_list('specialization', flat=True)
            .distinct()
        )
        return Response(sorted(list(set(filter(None, specs)))))


# Backward compatibility
class DoctorListCreateView(DoctorViewSet):
    pass
