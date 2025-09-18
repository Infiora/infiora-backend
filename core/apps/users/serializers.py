from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.general.validators import password_validator, username_validator

User = get_user_model()


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for listing users in admin panel with essential fields only"""

    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_email_verified",
            "date_joined",
            "last_login",
            "created_by",
            "created_by_username",
        )
        read_only_fields = ("id", "date_joined", "last_login", "created_by", "created_by_username")


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed user management with all admin capabilities"""

    password = serializers.CharField(write_only=True, required=False, validators=[password_validator])
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = User
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
            "created_by_username",
            "password",
        )
        read_only_fields = ("id", "date_joined", "last_login", "created_by", "created_by_username")

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Handle password separately
        if password:
            instance.set_password(password)

        instance.save()
        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users through admin panel"""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, validators=[password_validator])
    username = serializers.CharField(validators=[username_validator])

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_email_verified",
        )

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user
