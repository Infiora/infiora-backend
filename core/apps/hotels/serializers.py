from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Hotel

User = get_user_model()


class HotelListSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = [
            "id",
            "name",
            "address",
            "phone",
            "email",
            "image",
            "cover",
            "active_until",
            "is_active",
            "created_at",
            "created_by",
            "created_by_username",
            "user_count",
        ]
        read_only_fields = ["id", "created_at", "created_by", "created_by_username", "user_count"]

    def get_user_count(self, obj):
        return obj.users.count()


class HotelDetailSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = [
            "id",
            "name",
            "description",
            "address",
            "phone",
            "email",
            "website",
            "image",
            "cover",
            "note",
            "active_until",
            "social_links",
            "is_active",
            "created_at",
            "updated_at",
            "created_by",
            "created_by_username",
            "user_count",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "created_by_username", "user_count"]

    def get_user_count(self, obj):
        return obj.users.count()


class HotelCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = [
            "name",
            "description",
            "address",
            "phone",
            "email",
            "website",
            "image",
            "cover",
            "note",
            "active_until",
            "social_links",
            "is_active",
        ]

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
