from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from core.general.permissions import CanCreateUsers, CanManageUsers

from .schemas import user_create_schema, user_delete_schema, user_detail_schema, user_list_schema, user_update_schema
from .serializers import UserCreateSerializer, UserDetailSerializer, UserListSerializer

User = get_user_model()


class UserViewSet(ModelViewSet):
    """
    ViewSet for hierarchical user management.
    - Admin users can manage ALL users
    - Manager users can only manage users they created
    """

    queryset = User.objects.all()
    permission_classes = [CanManageUsers]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active", "is_staff", "is_superuser", "is_email_verified", "created_by"]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering_fields = ["username", "email", "date_joined", "last_login"]
    ordering = ["-date_joined"]

    def get_queryset(self):
        """
        Filter queryset based on user permissions:
        - Admin users see all users
        - Manager users only see users they created
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Admin users can see all users
        if user.is_superuser and user.is_staff:
            return queryset

        # Manager users only see users they created
        if user.is_staff:
            return queryset.filter(created_by=user)

        # Regular users see nothing (should not reach here due to permissions)
        return queryset.none()

    def get_permissions(self):
        """
        Instantiate and return the list of permissions for this view.
        """
        if self.action == "create":
            permission_classes = [CanCreateUsers]
        else:
            permission_classes = [CanManageUsers]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "list":
            return UserListSerializer
        elif self.action == "create":
            return UserCreateSerializer
        else:
            return UserDetailSerializer

    @user_list_schema
    def list(self, request, *args, **kwargs):
        """List all users"""
        return super().list(request, *args, **kwargs)

    @user_create_schema
    def create(self, request, *args, **kwargs):
        """Create a new user account"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Set the created_by field to the current user
        user = serializer.save(created_by=request.user)

        # Return detailed user data
        response_serializer = UserDetailSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @user_detail_schema
    def retrieve(self, request, *args, **kwargs):
        """Get user details"""
        return super().retrieve(request, *args, **kwargs)

    @user_update_schema
    def update(self, request, *args, **kwargs):
        """Update user account"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Prevent admin from removing their own superuser status
        if (
            instance == request.user
            and "is_superuser" in serializer.validated_data
            and not serializer.validated_data["is_superuser"]
        ):
            return Response(
                {"detail": "Cannot remove superuser status from your own account."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent admin from deactivating their own account
        if (
            instance == request.user
            and "is_active" in serializer.validated_data
            and not serializer.validated_data["is_active"]
        ):
            return Response({"detail": "Cannot deactivate your own account."}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)

    @user_update_schema
    def partial_update(self, request, *args, **kwargs):
        """Partially update user account"""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    @user_delete_schema
    def destroy(self, request, *args, **kwargs):
        """Delete user account"""
        instance = self.get_object()

        # Prevent admin from deleting their own account
        if instance == request.user:
            return Response({"detail": "Cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
