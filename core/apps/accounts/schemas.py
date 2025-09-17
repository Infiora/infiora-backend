"""
API Schema definitions for accounts app using drf-spectacular
"""

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status

from .serializers import (
    AccountSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    LogoutSerializer,
    RefreshTokenSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    SendVerificationEmailSerializer,
    VerifyEmailSerializer,
)

# Common responses
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

TOKEN_ERROR_RESPONSE = OpenApiResponse(
    response={
        "type": "object",
        "properties": {"message": {"type": "string", "example": "Token is invalid or expired"}},
    },
    description="Token validation error",
)


# Register endpoint schema
register_schema = extend_schema(
    summary="Register new user",
    description="Create a new user account with username, email, and password",
    request=RegisterSerializer,
    responses={
        status.HTTP_201_CREATED: OpenApiResponse(
            response=AccountSerializer,
            description="User successfully registered",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
    },
    examples=[
        OpenApiExample(
            "Valid Registration",
            value={"username": "johndoe", "email": "john@example.com", "password": "Password123"},
            request_only=True,
        )
    ],
    tags=["Authentication"],
)


# Login endpoint schema
login_schema = extend_schema(
    summary="User login",
    description="Authenticate user and return JWT tokens",
    request=LoginSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response={
                "type": "object",
                "properties": {
                    "access_token": {"type": "string", "example": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."},
                    "refresh_token": {"type": "string", "example": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."},
                    "user": {"$ref": "#/components/schemas/Account"},
                },
            },
            description="Login successful, tokens and user data returned",
        ),
        status.HTTP_401_UNAUTHORIZED: OpenApiResponse(
            response={"type": "object", "properties": {"error": {"type": "string", "example": "Invalid credentials"}}},
            description="Invalid login credentials",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
    },
    examples=[
        OpenApiExample(
            "Login with Email", value={"login": "john@example.com", "password": "Password123"}, request_only=True
        ),
        OpenApiExample(
            "Login with Username", value={"login": "johndoe", "password": "Password123"}, request_only=True
        ),
    ],
    tags=["Authentication"],
)


# Logout endpoint schema
logout_schema = extend_schema(
    summary="User logout",
    description="Blacklist refresh token to logout user",
    request=LogoutSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response={
                "type": "object",
                "properties": {"message": {"type": "string", "example": "Successfully logged out"}},
            },
            description="Successfully logged out",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: TOKEN_ERROR_RESPONSE,
    },
    tags=["Authentication"],
)


# Refresh token endpoint schema
refresh_token_schema = extend_schema(
    summary="Refresh access token",
    description="Get new access token using refresh token",
    request=RefreshTokenSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response={
                "type": "object",
                "properties": {
                    "access_token": {"type": "string", "example": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."},
                    "refresh_token": {"type": "string", "example": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."},
                },
            },
            description="New access and refresh tokens generated",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: TOKEN_ERROR_RESPONSE,
    },
    tags=["Authentication"],
)


# Forgot password endpoint schema
forgot_password_schema = extend_schema(
    summary="Request password reset",
    description="Send password reset email to user",
    request=ForgotPasswordSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response={
                "type": "object",
                "properties": {"message": {"type": "string", "example": "Password reset email sent."}},
            },
            description="Password reset email sent",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
    },
    tags=["Password Management"],
)


# Reset password endpoint schema
reset_password_schema = extend_schema(
    summary="Reset password",
    description="Reset user password using reset token",
    request=ResetPasswordSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response={
                "type": "object",
                "properties": {"message": {"type": "string", "example": "Password reset successfully"}},
            },
            description="Password successfully reset",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: TOKEN_ERROR_RESPONSE,
    },
    tags=["Password Management"],
)


# Send verification email endpoint schema
send_verification_email_schema = extend_schema(
    summary="Send email verification",
    description="Send verification email to user",
    request=SendVerificationEmailSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response={
                "type": "object",
                "properties": {"message": {"type": "string", "example": "Verification email sent."}},
            },
            description="Verification email sent",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
    },
    tags=["Email Verification"],
)


# Verify email endpoint schema
verify_email_schema = extend_schema(
    summary="Verify email address",
    description="Verify user email using verification token",
    request=VerifyEmailSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response={
                "type": "object",
                "properties": {"message": {"type": "string", "example": "Email verified successfully"}},
            },
            description="Email successfully verified",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: TOKEN_ERROR_RESPONSE,
    },
    tags=["Email Verification"],
)


# User profile endpoint schema
user_profile_schema = extend_schema(
    summary="Get user profile",
    description="Get current authenticated user's profile information",
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=AccountSerializer,
            description="User profile information",
        ),
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
    },
    tags=["User Profile"],
)


# Update user profile endpoint schema
update_user_profile_schema = extend_schema(
    summary="Update user profile",
    description="Update current authenticated user's profile information",
    request=AccountSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(
            response=AccountSerializer,
            description="Updated user profile information",
        ),
        status.HTTP_400_BAD_REQUEST: VALIDATION_ERROR_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: UNAUTHORIZED_RESPONSE,
    },
    tags=["User Profile"],
)
