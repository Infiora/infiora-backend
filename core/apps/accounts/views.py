from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .serializers import (
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

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully"},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                request=request,
                username=serializer.validated_data["login"],
                password=serializer.validated_data["password"],
            )
            if user:
                refresh = RefreshToken.for_user(user)
                return Response(
                    {
                        "refresh_token": str(refresh),
                        "access_token": str(refresh.access_token),
                    }
                )
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):

    @handle_token_error
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            token = RefreshToken(serializer.validated_data["refresh_token"])
            token.blacklist()
            return Response(
                {"message": "User logged out successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RefreshTokenView(APIView):

    @handle_token_error
    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        if serializer.is_valid():
            refresh = RefreshToken(serializer.validated_data["refresh_token"])
            return Response(
                {
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]  # noqa: F841
            # user = User.objects.get(email=email)
            # token = str(RefreshToken.for_user(user))
            # send_reset_password_email(user, token)  # TODO: Implement email functionality
            return Response({"message": "Password reset email sent."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):

    @handle_token_error
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            token = RefreshToken(serializer.validated_data.get("token"))
            password = serializer.validated_data.get("password")
            user = User.objects.get(id=token.payload["user_id"])
            user.set_password(password)
            user.save()
            token.blacklist()
            return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendVerificationEmailView(APIView):

    def post(self, request):
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

    @handle_token_error
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        if serializer.is_valid():
            token = RefreshToken(serializer.validated_data.get("token"))
            user = User.objects.get(id=token.payload["user_id"])
            user.is_email_verified = True
            user.save()
            token.blacklist()
            return Response({"message": "Email verified successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
