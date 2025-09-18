"""
Common permission classes used across multiple apps
"""

from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Custom permission to only allow admin users (staff + superuser) to access the view.
    """

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_staff and request.user.is_superuser
        )

    def has_object_permission(self, request, view, obj):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_staff and request.user.is_superuser
        )


class CanManageUsers(BasePermission):
    """
    Permission that allows:
    - Admin users (superuser + staff) to manage ALL users
    - Manager users (staff only) to manage only users they created
    - Regular users cannot manage other users
    """

    def has_permission(self, request, view):
        # Must be authenticated and have staff privileges
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)

    def has_object_permission(self, request, view, obj):
        # Admin users can manage all users
        if request.user.is_superuser and request.user.is_staff:
            return True

        # Manager users can only manage users they created
        if request.user.is_staff and hasattr(obj, "created_by"):
            return obj.created_by == request.user

        return False


class CanCreateUsers(BasePermission):
    """
    Permission that allows staff users to create new users.
    Both admin and manager users can create users.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
