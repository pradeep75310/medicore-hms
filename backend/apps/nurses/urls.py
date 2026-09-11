from django.urls import path
from .views import NurseListCreateView

urlpatterns = [
    path('', NurseListCreateView.as_view(), name='nurse-list-create'),
]
