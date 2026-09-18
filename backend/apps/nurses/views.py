from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Nurse
from .serializers import NurseSerializer


class NurseViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Nurses with filtering and search.
    """
    queryset = Nurse.objects.select_related('hospital').all()
    serializer_class = NurseSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'first_name',
        'last_name',
        'department',
        'assigned_ward',
        'license_number',
        'email',
        'phone',
        'hospital__name'
    ]
    ordering_fields = ['first_name', 'department', 'shift', 'experience_years', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Nurse.objects.select_related('hospital').all()
        hospital_id = self.request.query_params.get('hospital')
        department = self.request.query_params.get('department')
        shift = self.request.query_params.get('shift')
        is_active = self.request.query_params.get('is_active')

        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if department:
            queryset = queryset.filter(department__icontains=department)
        if shift:
            queryset = queryset.filter(shift__iexact=shift)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset

    @action(detail=False, methods=['get'])
    def shifts(self, request):
        """Return available nurse shift choices"""
        shifts = [s[0] for s in Nurse.SHIFT_CHOICES]
        return Response(shifts)


# Backward compatibility
class NurseListCreateView(NurseViewSet):
    pass
