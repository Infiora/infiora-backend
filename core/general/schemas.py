"""
Common OpenAPI schema responses used across multiple apps
"""

from drf_spectacular.utils import OpenApiResponse

# Common error responses
VALIDATION_ERROR_RESPONSE = OpenApiResponse(
    response={
        "type": "object",
        "properties": {
            "field_name": {"type": "array", "items": {"type": "string"}, "example": ["This field is required."]}
        },
    },
    description="Validation error with field-specific messages",
)

UNAUTHORIZED_RESPONSE = OpenApiResponse(
    response={
        "type": "object",
        "properties": {"detail": {"type": "string", "example": "Authentication credentials were not provided."}},
    },
    description="Authentication required",
)

ADMIN_FORBIDDEN_RESPONSE = OpenApiResponse(
    response={
        "type": "object",
        "properties": {"detail": {"type": "string", "example": "You do not have permission to perform this action."}},
    },
    description="Admin permission required",
)

TOKEN_ERROR_RESPONSE = OpenApiResponse(
    response={
        "type": "object",
        "properties": {"message": {"type": "string", "example": "Token is invalid or expired"}},
    },
    description="Token validation error",
)

NOT_FOUND_RESPONSE = OpenApiResponse(
    response={
        "type": "object",
        "properties": {"detail": {"type": "string", "example": "Not found."}},
    },
    description="Resource not found",
)

SELF_ACTION_ERROR_RESPONSE = OpenApiResponse(
    response={
        "type": "object",
        "properties": {"detail": {"type": "string", "example": "Cannot perform this action on your own account."}},
    },
    description="Cannot perform action on own account",
)
