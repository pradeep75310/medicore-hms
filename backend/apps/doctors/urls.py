from django.urls import path
from .views import DoctorListCreateView

urlpatterns = [
    path('', DoctorListCreateView.as_view(), name='doctor-list-create'),
]
