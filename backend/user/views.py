from django.contrib.auth import get_user_model, logout, update_session_auth_hash
from django_utils_kit.viewsets import ImprovedViewSet
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from user.serializers import (
    UpdatePasswordSerializer,
    UserSimpleSerializer,
)

User = get_user_model()


class CurrentUserViewSet(ImprovedViewSet):
    """For the current user to view/update some of its information."""

    default_permission_classes = (IsAuthenticated,)
    serializer_class_per_action = {
        "account": UserSimpleSerializer,
        "password": UpdatePasswordSerializer,
    }

    @extend_schema(
        methods=["DELETE"],
        description="Delete the current user's account.",
        responses={204: None},
    )
    @extend_schema(
        methods=["PUT"],
        description="Update the current user's account.",
        responses={200: UserSimpleSerializer},
    )
    @extend_schema(
        methods=["GET"],
        description="Get the current user's account.",
        responses={200: UserSimpleSerializer},
    )
    @action(detail=False, methods=["get", "put", "delete"])
    def account(self, request: Request) -> Response:
        """Handle account operations: GET, PUT, DELETE."""
        if request.method == "GET":
            # Fetch the user data
            serializer = self.get_serializer(request.user)
            return Response(serializer.data, status.HTTP_200_OK)
        elif request.method == "PUT":
            # Update the user
            serializer = self.get_valid_serializer(request.user, data=request.data)
            serializer.save()
            return Response(serializer.data, status.HTTP_200_OK)
        elif request.method == "DELETE":
            # Delete the current user
            user = request.user
            logout(request)
            user.delete()
            return Response(None, status.HTTP_204_NO_CONTENT)
        return Response(None, status.HTTP_405_METHOD_NOT_ALLOWED)

    @extend_schema(responses={204: None})
    @action(detail=False, methods=["put"])
    def password(self, request: Request) -> Response:
        serializer = self.get_valid_serializer(request.user, data=request.data)
        user = serializer.save()
        update_session_auth_hash(request, user)
        return Response(None, status.HTTP_204_NO_CONTENT)


class UserViewSet(ImprovedViewSet):
    """For managing users list."""

    default_permission_classes = (IsAuthenticated,)
    default_serializer_class = UserSimpleSerializer
    queryset = User.objects.all()

    @extend_schema(
        description="Get list of all users.",
        responses={200: UserSimpleSerializer(many=True)},
    )
    def list(self, request: Request) -> Response:
        """Get all users."""
        users = self.get_queryset()
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data, status.HTTP_200_OK)

    @extend_schema(
        description="Get a specific user.",
        responses={200: UserSimpleSerializer},
    )
    def retrieve(self, request: Request, pk: int = None) -> Response:
        """Get a specific user."""
        user = self.get_object()
        serializer = self.get_serializer(user)
        return Response(serializer.data, status.HTTP_200_OK)

    @extend_schema(
        description="Create a new user.",
        request=UserSimpleSerializer,
        responses={201: UserSimpleSerializer},
    )
    def create(self, request: Request) -> Response:
        """Create a new user."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(serializer.data, status.HTTP_201_CREATED)

    @extend_schema(
        description="Update a user.",
        request=UserSimpleSerializer,
        responses={200: UserSimpleSerializer},
    )
    def update(self, request: Request, pk: int = None) -> Response:
        """Update a user."""
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status.HTTP_200_OK)

    @extend_schema(
        description="Partially update a user.",
        request=UserSimpleSerializer,
        responses={200: UserSimpleSerializer},
    )
    def partial_update(self, request: Request, pk: int = None) -> Response:
        """Partially update a user."""
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status.HTTP_200_OK)

    @extend_schema(
        description="Delete a user.",
        responses={204: None},
    )
    def destroy(self, request: Request, pk: int = None) -> Response:
        """Delete a user."""
        user = self.get_object()
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
