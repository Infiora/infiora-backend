"""
API Schema definitions for hotels app using drf-spectacular
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status

from core.shared.api.schemas import NOT_FOUND_RESPONSE, UNAUTHORIZED_RESPONSE, VALIDATION_ERROR_RESPONSE

from .serializers import HotelCreateSerializer, HotelDetailSerializer, HotelListSerializer

# Hotel list schema
hotel_list_schema = extend_schema(
    summary="List hotels (Hierarchical Access)",
    description="""
    Get paginated list of hotels with filtering and search capabilities.

    **Access Control:**
    - **Admin users** (superuser + staff): Can see ALL hotels
    - **Staff users**: Can only see hotels they created
    - **Regular users**: No access

    **Query Parameters:**
    - **user**: Filter hotels by specific user ID (admin only). Returns hotels that the specified user belongs to.
    - **is_active**: Filter by hotel active status
    - **created_by**: Filter by creator user ID
    - **search**: Search in name, address, phone, email fields
    - **ordering**: Order by name, created_at (prefix with '-' for descending)
    """,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=HotelListSerializer(many=True),
            description="List of hotels (filtered by permissions)",
        ),
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: OpenApiResponse(
            response={"type": "object", "properties": {"detail": {"type": "string", "example": "Permission denied"}}},
            description="Access forbidden - staff privileges required",
        ),
    },
    tags=["Hotel Management"],
)


# Hotel create schema
hotel_create_schema = extend_schema(
    summary="Create hotel (Staff Access)",
    description="""
    Create a new hotel. Only staff users can create hotels.

    **Access Control:**
    - **Admin users** (superuser + staff): Can create hotels
    - **Staff users**: Can create hotels (will be able to manage them)
    - **Regular users**: No access

    **Note:** The `created_by` field is automatically set to the current user.
    """,
    request=HotelCreateSerializer,
    responses={
        status.HTTP_201_CREATED: OpenApiResponse(
            response=HotelDetailSerializer,
            description="Hotel created successfully",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: OpenApiResponse(
            response={"type": "object", "properties": {"detail": {"type": "string", "example": "Permission denied"}}},
            description="Access forbidden - staff privileges required",
        ),
    },
    tags=["Hotel Management"],
)


# Hotel detail schema
hotel_detail_schema = extend_schema(
    summary="Get hotel details (Hierarchical Access)",
    description="""
    Get detailed information about a specific hotel.

    **Access Control:**
    - **Admin users**: Can view ANY hotel's details
    - **Staff users**: Can only view details of hotels they created
    """,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=HotelDetailSerializer,
            description="Hotel details",
        ),
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: OpenApiResponse(
            response={"type": "object", "properties": {"detail": {"type": "string", "example": "Permission denied"}}},
            description="Access forbidden - insufficient privileges",
        ),
        status.HTTP_404_NOT_FOUND: NOT_FOUND_RESPONSE,
    },
    tags=["Hotel Management"],
)


# Hotel update schema
hotel_update_schema = extend_schema(
    summary="Update hotel (Hierarchical Access)",
    description="""
    Update hotel information.

    **Access Control:**
    - **Admin users**: Can update ANY hotel
    - **Staff users**: Can only update hotels they created
    """,
    request=HotelDetailSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=HotelDetailSerializer,
            description="Hotel updated successfully",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: OpenApiResponse(
            response={"type": "object", "properties": {"detail": {"type": "string", "example": "Permission denied"}}},
            description="Access forbidden - insufficient privileges",
        ),
        status.HTTP_404_NOT_FOUND: NOT_FOUND_RESPONSE,
    },
    tags=["Hotel Management"],
)


# Hotel delete schema
hotel_delete_schema = extend_schema(
    summary="Delete hotel (Hierarchical Access)",
    description="""
    Delete a hotel permanently.

    **Access Control:**
    - **Admin users**: Can delete ANY hotel
    - **Staff users**: Can only delete hotels they created
    """,
    responses={
        status.HTTP_204_NO_CONTENT: OpenApiResponse(description="Hotel deleted successfully"),
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
        status.HTTP_403_FORBIDDEN: OpenApiResponse(
            response={"type": "object", "properties": {"detail": {"type": "string", "example": "Permission denied"}}},
            description="Access forbidden - insufficient privileges",
        ),
        status.HTTP_404_NOT_FOUND: NOT_FOUND_RESPONSE,
    },
    tags=["Hotel Management"],
)
