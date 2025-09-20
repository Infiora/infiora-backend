from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.apps.hotels.serializers import HotelListSerializer
from core.shared.validation.validators import password_validator, username_validator

User = get_user_model()


class UserCreatedBySerializer(serializers.ModelSerializer):
    """Nested serializer for created_by user information"""

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
        )


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for listing users in admin panel with essential fields only"""

    created_by = UserCreatedBySerializer(read_only=True)
    hotels = HotelListSerializer(many=True, read_only=True)

    class Meta:
        model = User
        exclude = ("password",)  # Exclude password field
        read_only_fields = ("id", "date_joined", "last_login", "created_by", "hotels")


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed user management with all admin capabilities"""

    password = serializers.CharField(write_only=True, required=False, validators=[password_validator])
    created_by = UserCreatedBySerializer(read_only=True)
    hotels = HotelListSerializer(many=True, read_only=True)

    class Meta:
        model = User
        exclude = ()  # Include all fields
        extra_kwargs = {"password": {"write_only": True}}  # Ensure password is write-only
        read_only_fields = ("id", "date_joined", "last_login", "created_by", "hotels")

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
        exclude = ("last_login", "date_joined", "created_by")  # Exclude auto-generated fields
        extra_kwargs = {"password": {"write_only": True}}  # Ensure password is write-only

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user
