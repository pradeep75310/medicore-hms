from django.urls import path

from .views import (
    HospitalListCreateView,
    HospitalDetailView,
)


urlpatterns = [

    # Hospitals
    path(
        "hospitals/",
        HospitalListCreateView.as_view(),
        name="hospital_list_create"
    ),

    path(
        "hospitals/<int:hospital_id>/",
        HospitalDetailView.as_view(),
        name="hospital_detail"
    ),
]