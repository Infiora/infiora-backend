from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from rest_framework import serializers

from .models import Account

User = get_user_model()

password_validator = RegexValidator(
    regex=r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$",
    message="Invalid password",
)
username_validator = RegexValidator(regex=r"^[a-zA-Z0-9_.-]*$", message="Invalid username")


class AccountSerializer(serializers.ModelSerializer):

    class Meta:
        model = Account
        fields = (
            "username",
            "email",
            "first_name",
            "last_name",
            "image",
            "is_email_verified",
        )


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, validators=[password_validator])
    username = serializers.CharField(validators=[username_validator])

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, validators=[password_validator])


class LogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(required=True)


class RefreshTokenSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(required=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        # Check if any user in the database has this email
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return value


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, validators=[password_validator])


class SendVerificationEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        # Check if any user in the database has this email
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return value


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
