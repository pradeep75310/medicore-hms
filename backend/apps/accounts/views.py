from rest_framework import generics
from rest_framework.permissions import AllowAny

from .serializers import UserRegistrationSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    Register a new application user.
    """

    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]