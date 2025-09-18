"""
Hotel-specific permission classes for the hotels app
"""

from rest_framework.permissions import BasePermission


class CanManageHotels(BasePermission):
    """
    Permission for hotel management.
    - Superadmin users can manage ALL hotels
    - Staff users can only manage hotels they created
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)

    def has_object_permission(self, request, view, obj):
        # Superadmin users can access all hotels
        if request.user.is_superuser and request.user.is_staff:
            return True

        # Staff users can only access hotels they created
        if request.user.is_staff and hasattr(obj, "created_by"):
            return obj.created_by == request.user

        return False


class CanCreateHotels(BasePermission):
    """
    Permission for hotel creation.
    Only staff users can create hotels.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsHotelAdminOrSuperuser(BasePermission):
    """
    Permission for hotel-specific operations.
    - Superuser can access all
    - Hotel admin can access their hotel's resources
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Superuser can access everything
        if request.user.is_superuser and request.user.is_staff:
            return True

        # Hotel admin can access their hotel's resources
        if hasattr(request.user, "hotel") and request.user.hotel and request.user.is_hotel_admin:
            if hasattr(obj, "hotel"):
                return obj.hotel == request.user.hotel
            elif hasattr(obj, "users"):  # For hotel objects
                return obj == request.user.hotel

        return False


class IsHotelUser(BasePermission):
    """
    Permission for hotel users to access hotel-related resources.
    - Superuser can access all
    - Users can only access resources related to their hotel
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Superuser can access everything
        if request.user.is_superuser and request.user.is_staff:
            return True

        # Users with hotel can access their hotel's resources
        if hasattr(request.user, "hotel") and request.user.hotel:
            if hasattr(obj, "hotel"):
                return obj.hotel == request.user.hotel
            elif hasattr(obj, "users"):  # For hotel objects
                return obj == request.user.hotel

        return False
