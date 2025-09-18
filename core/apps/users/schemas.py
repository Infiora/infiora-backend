"""
API Schema definitions for users app using drf-spectacular
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status

from core.shared.api.schemas import (
    ADMIN_FORBIDDEN_RESPONSE,
    NOT_FOUND_RESPONSE,
    SELF_ACTION_ERROR_RESPONSE,
    UNAUTHORIZED_RESPONSE,
    VALIDATION_ERROR_RESPONSE,
)

from .serializers import UserCreateSerializer, UserDetailSerializer, UserListSerializer

# User list schema
user_list_schema = extend_schema(
    summary="List users (Hierarchical Access)",
    description="""
    Get paginated list of users with filtering and search capabilities.

    **Access Control:**
    - **Admin users** (superuser + staff): Can see ALL users
    - **Manager users** (staff only): Can only see users they created
    - **Regular users**: No access
    """,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=UserListSerializer(many=True),
            description="List of users (filtered by permissions)",
        ),
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: ADMIN_FORBIDDEN_RESPONSE,
    },
    tags=["User Management"],
)


# User create schema
user_create_schema = extend_schema(
    summary="Create user (Staff Access)",
    description="""
    Create a new user account. The created user will have a relationship to the creator.

    **Access Control:**
    - **Admin users** (superuser + staff): Can create users
    - **Manager users** (staff only): Can create users (will be able to manage them)
    - **Regular users**: No access

    **Note:** The `created_by` field is automatically set to the current user.
    """,
    request=UserCreateSerializer,
    responses={
        status.HTTP_201_CREATED: OpenApiResponse(
            response=UserDetailSerializer,
            description="User created successfully",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: ADMIN_FORBIDDEN_RESPONSE,
    },
    tags=["User Management"],
)


# User detail schema
user_detail_schema = extend_schema(
    summary="Get user details (Hierarchical Access)",
    description="""
    Get detailed information about a specific user.

    **Access Control:**
    - **Admin users**: Can view ANY user's details
    - **Manager users**: Can only view details of users they created
    """,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=UserDetailSerializer,
            description="User details",
        ),
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: ADMIN_FORBIDDEN_RESPONSE,
        status.HTTP_404_NOT_FOUND: NOT_FOUND_RESPONSE,
    },
    tags=["User Management"],
)


# User update schema
user_update_schema = extend_schema(
    summary="Update user (Admin only)",
    description="Update user account information",
    request=UserDetailSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=UserDetailSerializer,
            description="User updated successfully",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: ADMIN_FORBIDDEN_RESPONSE,
        status.HTTP_404_NOT_FOUND: NOT_FOUND_RESPONSE,
    },
    tags=["User Management"],
)


# User delete schema
user_delete_schema = extend_schema(
    summary="Delete user (Admin only)",
    description="Delete a user account permanently",
    responses={
        status.HTTP_204_NO_CONTENT: OpenApiResponse(description="User deleted successfully"),
        status.HTTP_400_BAD_REQUEST: SELF_ACTION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: ADMIN_FORBIDDEN_RESPONSE,
        status.HTTP_404_NOT_FOUND: NOT_FOUND_RESPONSE,
    },
    tags=["User Management"],
)


# User activate schema
user_activate_schema = extend_schema(
    summary="Activate user (Admin only)",
    description="Activate a user account",
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=UserDetailSerializer,
            description="User activated successfully",
        ),
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: ADMIN_FORBIDDEN_RESPONSE,
        status.HTTP_404_NOT_FOUND: NOT_FOUND_RESPONSE,
    },
    tags=["User Management"],
)


# User deactivate schema
user_deactivate_schema = extend_schema(
    summary="Deactivate user (Admin only)",
    description="Deactivate a user account",
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=UserDetailSerializer,
            description="User deactivated successfully",
        ),
        status.HTTP_400_BAD_REQUEST: SELF_ACTION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: ADMIN_FORBIDDEN_RESPONSE,
        status.HTTP_404_NOT_FOUND: NOT_FOUND_RESPONSE,
    },
    tags=["User Management"],
)


# Make staff schema
make_staff_schema = extend_schema(
    summary="Grant staff privileges (Admin only)",
    description="Grant staff privileges to a user",
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=UserDetailSerializer,
            description="Staff privileges granted successfully",
        ),
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: ADMIN_FORBIDDEN_RESPONSE,
        status.HTTP_404_NOT_FOUND: NOT_FOUND_RESPONSE,
    },
    tags=["User Management"],
)


# Remove staff schema
remove_staff_schema = extend_schema(
    summary="Remove staff privileges (Admin only)",
    description="Remove staff privileges from a user",
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=UserDetailSerializer,
            description="Staff privileges removed successfully",
        ),
        status.HTTP_400_BAD_REQUEST: SELF_ACTION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: ADMIN_FORBIDDEN_RESPONSE,
        status.HTTP_404_NOT_FOUND: NOT_FOUND_RESPONSE,
    },
    tags=["User Management"],
)


# Reset password schema
reset_password_schema = extend_schema(
    summary="Reset user password (Admin only)",
    description="Reset a user's password to a random secure password",
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response={
                "type": "object",
                "properties": {
                    "detail": {"type": "string", "example": "Password reset successfully."},
                    "new_password": {"type": "string", "example": "Abc123Def456"},
                    "message": {
                        "type": "string",
                        "example": "Provide this password to the user and ask them to change it on first login.",
                    },
                },
            },
            description="Password reset successfully",
        ),
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: ADMIN_FORBIDDEN_RESPONSE,
        status.HTTP_404_NOT_FOUND: NOT_FOUND_RESPONSE,
    },
    tags=["User Management"],
)
