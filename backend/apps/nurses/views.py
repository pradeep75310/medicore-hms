from rest_framework import generics
from .models import Nurse
from .serializers import NurseSerializer


class NurseListCreateView(generics.ListCreateAPIView):
    queryset = Nurse.objects.all()
    serializer_class = NurseSerializer
# Create your views here.
