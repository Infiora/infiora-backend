from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Hotel

User = get_user_model()


class HotelOwnerSerializer(serializers.ModelSerializer):
    """Nested serializer for owner user information in hotel context"""

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


class HotelListSerializer(serializers.ModelSerializer):
    users = HotelOwnerSerializer(many=True, read_only=True)
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = "__all__"
        read_only_fields = ["id", "created_at", "users", "user_count"]

    def get_user_count(self, obj):
        return obj.users.count()


class HotelDetailSerializer(serializers.ModelSerializer):
    users = HotelOwnerSerializer(many=True, read_only=True)
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "users", "user_count"]

    def get_user_count(self, obj):
        return obj.users.count()


class HotelCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = "__all__"

    def validate_name(self, value):
        if Hotel.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("A hotel with this name already exists.")
        return value

    def validate_social_links(self, value):
        """Validate social_links JSON structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Social links must be a valid JSON object.")

        # Optional: Validate specific social media platforms
        allowed_platforms = ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok", "website"]
        for platform, url in value.items():
            if platform not in allowed_platforms:
                raise serializers.ValidationError(f"'{platform}' is not a supported social media platform.")
            if not isinstance(url, str) or not url.strip():
                raise serializers.ValidationError(f"URL for '{platform}' must be a non-empty string.")

        return value
