from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Hotel
from .permissions import CanCreateHotels, CanManageHotels
from .schemas import (
    hotel_create_schema,
    hotel_delete_schema,
    hotel_detail_schema,
    hotel_list_schema,
    hotel_update_schema,
)
from .serializers import HotelCreateSerializer, HotelDetailSerializer, HotelListSerializer


class HotelViewSet(ModelViewSet):
    """
    ViewSet for hierarchical hotel management.
    - Admin users can manage ALL hotels
    - Staff users can only manage hotels they created
    """

    queryset = Hotel.objects.all()
    permission_classes = [CanManageHotels]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active", "created_by"]
    search_fields = ["name", "address", "phone", "email"]
    ordering_fields = ["name", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """
        Filter queryset based on user permissions:
        - Admin users see all hotels
        - Staff users only see hotels they created
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Admin users can see all hotels
        if user.is_superuser and user.is_staff:
            return queryset

        # Staff users only see hotels they created
        if user.is_staff:
            return queryset.filter(created_by=user)

        # Regular users see nothing (should not reach here due to permissions)
        return queryset.none()

    def get_permissions(self):
        """
        Instantiate and return the list of permissions for this view.
        """
        if self.action == "create":
            permission_classes = [CanCreateHotels]
        else:
            permission_classes = [CanManageHotels]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "list":
            return HotelListSerializer
        elif self.action == "create":
            return HotelCreateSerializer
        else:
            return HotelDetailSerializer

    @hotel_list_schema
    def list(self, request, *args, **kwargs):  # noqa: A003
        """List all hotels"""
        return super().list(request, *args, **kwargs)

    @hotel_create_schema
    def create(self, request, *args, **kwargs):
        """Create a new hotel"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Set the created_by field to the current user
        hotel = serializer.save(created_by=request.user)

        # Return detailed hotel data
        response_serializer = HotelDetailSerializer(hotel)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @hotel_detail_schema
    def retrieve(self, request, *args, **kwargs):
        """Get hotel details"""
        return super().retrieve(request, *args, **kwargs)

    @hotel_update_schema
    def update(self, request, *args, **kwargs):
        """Update hotel information"""
        return super().update(request, *args, **kwargs)

    @hotel_update_schema
    def partial_update(self, request, *args, **kwargs):
        """Partially update hotel information"""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    @hotel_delete_schema
    def destroy(self, request, *args, **kwargs):
        """Delete hotel"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
