from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .schemas import (
    forgot_password_schema,
    login_schema,
    logout_schema,
    refresh_token_schema,
    register_schema,
    reset_password_schema,
    send_verification_email_schema,
    update_user_profile_schema,
    user_profile_schema,
    verify_email_schema,
)
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

# from core.emails.utils import send_reset_password_email, send_verification_email


User = get_user_model()


def handle_token_error(func):

    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except TokenError as e:
            return Response({"message": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

    return wrapper


class RegisterView(APIView):
    """User registration endpoint"""

    @register_schema
    def post(self, request):
        """Register a new user account"""
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user_serializer = AccountSerializer(user)
            return Response(user_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """User login endpoint"""

    @login_schema
    def post(self, request):
        """Authenticate user and return JWT tokens"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                request=request,
                username=serializer.validated_data["login"],
                password=serializer.validated_data["password"],
            )
            if user:
                if not user.is_active:
                    return Response({"error": "Account is deactivated"}, status=status.HTTP_401_UNAUTHORIZED)
                refresh = RefreshToken.for_user(user)
                user_serializer = AccountSerializer(user)
                return Response(
                    {
                        "access_token": str(refresh.access_token),
                        "refresh_token": str(refresh),
                        "user": user_serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """User logout endpoint"""

    @logout_schema
    @handle_token_error
    def post(self, request):
        """Blacklist refresh token to logout user"""
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            try:
                token = RefreshToken(serializer.validated_data["refresh_token"])

                # Get user info before blacklisting for logging purposes
                user_id = token.payload.get("user_id")  # noqa: F841

                # Blacklist the refresh token
                from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

                try:
                    outstanding_token = OutstandingToken.objects.get(token=str(token))
                    BlacklistedToken.objects.get_or_create(token=outstanding_token)
                except OutstandingToken.DoesNotExist:
                    pass

                return Response(
                    {"message": "Successfully logged out"},
                    status=status.HTTP_200_OK,
                )
            except Exception as e:  # noqa: F841
                # Handle case where token is already blacklisted or invalid
                return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RefreshTokenView(APIView):
    """Token refresh endpoint"""

    @refresh_token_schema
    @handle_token_error
    def post(self, request):
        """Get new access token using refresh token"""
        serializer = RefreshTokenSerializer(data=request.data)
        if serializer.is_valid():
            old_refresh = RefreshToken(serializer.validated_data["refresh_token"])

            # Get user from the refresh token
            user = User.objects.get(id=old_refresh.payload["user_id"])

            # Check if user is still active
            if not user.is_active:
                from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

                try:
                    outstanding_token = OutstandingToken.objects.get(token=str(old_refresh))
                    BlacklistedToken.objects.get_or_create(token=outstanding_token)
                except OutstandingToken.DoesNotExist:
                    pass
                return Response({"message": "Account is deactivated"}, status=status.HTTP_401_UNAUTHORIZED)

            # Generate new refresh token for token rotation security
            new_refresh = RefreshToken.for_user(user)

            # Blacklist the old refresh token
            from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

            try:
                outstanding_token = OutstandingToken.objects.get(token=str(old_refresh))
                BlacklistedToken.objects.get_or_create(token=outstanding_token)
            except OutstandingToken.DoesNotExist:
                pass

            return Response(
                {
                    "access_token": str(new_refresh.access_token),
                    "refresh_token": str(new_refresh),
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    """Password reset request endpoint"""

    @forgot_password_schema
    def post(self, request):
        """Send password reset email to user"""
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]  # noqa: F841
            # user = User.objects.get(email=email)
            # token = str(RefreshToken.for_user(user))
            # send_reset_password_email(user, token)  # TODO: Implement email functionality
            return Response({"message": "Password reset email sent."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    """Password reset endpoint"""

    @reset_password_schema
    @handle_token_error
    def post(self, request):
        """Reset user password using reset token"""
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            token = RefreshToken(serializer.validated_data.get("token"))
            password = serializer.validated_data.get("password")
            user = User.objects.get(id=token.payload["user_id"])
            user.set_password(password)
            user.save()
            from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

            try:
                outstanding_token = OutstandingToken.objects.get(token=str(token))
                BlacklistedToken.objects.get_or_create(token=outstanding_token)
            except OutstandingToken.DoesNotExist:
                pass
            return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendVerificationEmailView(APIView):
    """Email verification request endpoint"""

    @send_verification_email_schema
    def post(self, request):
        """Send verification email to user"""
        serializer = SendVerificationEmailSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            user = User.objects.get(email=email)
            if user.is_email_verified:
                return Response(
                    {"message": "Email already verified."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # token = str(RefreshToken.for_user(user))
            # send_verification_email(user, token)  # TODO: Implement email functionality
            return Response({"message": "Verification email sent."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    """Email verification endpoint"""

    @verify_email_schema
    @handle_token_error
    def post(self, request):
        """Verify user email using verification token"""
        serializer = VerifyEmailSerializer(data=request.data)
        if serializer.is_valid():
            token = RefreshToken(serializer.validated_data.get("token"))
            user = User.objects.get(id=token.payload["user_id"])
            user.is_email_verified = True
            user.save()
            from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

            try:
                outstanding_token = OutstandingToken.objects.get(token=str(token))
                BlacklistedToken.objects.get_or_create(token=outstanding_token)
            except OutstandingToken.DoesNotExist:
                pass
            return Response({"message": "Email verified successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserView(APIView):
    """User profile endpoint"""

    permission_classes = [IsAuthenticated]

    @user_profile_schema
    def get(self, request):
        """Get current authenticated user's profile information"""
        serializer = AccountSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @update_user_profile_schema
    def put(self, request):
        """Update current authenticated user's profile information"""
        serializer = AccountSerializer(request.user, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @update_user_profile_schema
    def patch(self, request):
        """Partially update current authenticated user's profile information"""
        serializer = AccountSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
