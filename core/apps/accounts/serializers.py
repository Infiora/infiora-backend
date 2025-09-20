from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.shared.validation.validators import password_validator, username_validator

from .models import Account

User = get_user_model()


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "image",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_email_verified",
            "date_joined",
            "last_login",
            "created_by",
            "hotels",
        )
        read_only_fields = (
            "id",
            "username",
            "email",
            "is_email_verified",
            "date_joined",
            "last_login",
            "created_by",
            "hotels",
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
