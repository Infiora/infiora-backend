"""
Hotel-specific permission classes for the hotels app
"""

from rest_framework.permissions import BasePermission


class CanManageHotels(BasePermission):
    """
    Permission for hotel management.
    - Admin users can manage ALL hotels
    - Regular users can only manage hotels they belong to
    """

    def has_permission(self, request, view):
        # Allow authenticated users - filtering is handled in get_queryset and has_object_permission
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Admin users can access all hotels
        if request.user.is_superuser and request.user.is_staff:
            return True

        # Regular users can only manage hotels they belong to
        if request.user in obj.users.all():
            return True

        return False


class CanCreateHotels(BasePermission):
    """
    Permission for hotel creation.
    Only admin users (superuser and staff) can create hotels.
    """

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_superuser and request.user.is_staff
        )


class IsHotelUserOrSuperuser(BasePermission):
    """
    Permission for hotel-specific operations.
    - Superuser can access all
    - Users can access resources of hotels they belong to
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Superuser can access everything
        if request.user.is_superuser and request.user.is_staff:
            return True

        # Users can access resources of hotels they belong to
        if hasattr(request.user, "hotels"):
            user_hotels = request.user.hotels.all()
            if hasattr(obj, "hotel") and obj.hotel in user_hotels:
                return True
            elif hasattr(obj, "users") and obj in user_hotels:  # For hotel objects
                return True

        return False


class IsHotelUser(BasePermission):
    """
    Permission for hotel users to access hotel-related resources.
    - Superuser can access all
    - Users can only access resources related to their hotels
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Superuser can access everything
        if request.user.is_superuser and request.user.is_staff:
            return True

        # Users with hotels can access their hotels' resources
        if hasattr(request.user, "hotels"):
            user_hotels = request.user.hotels.all()
            if hasattr(obj, "hotel") and obj.hotel in user_hotels:
                return True
            elif hasattr(obj, "users") and obj in user_hotels:  # For hotel objects
                return True

        return False
