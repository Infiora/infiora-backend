from django.contrib.auth import get_user_model
from django.db import models

from core.shared.storage.uploads import generate_upload_path

User = get_user_model()


class Hotel(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    address = models.TextField()
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    image = models.ImageField(
        upload_to=generate_upload_path("hotels", "image"), null=True, blank=True, help_text="Hotel logo/main image"
    )
    cover = models.ImageField(
        upload_to=generate_upload_path("hotels", "cover"), null=True, blank=True, help_text="Hotel cover image"
    )
    note = models.TextField(blank=True, help_text="Internal notes about the hotel")
    active_until = models.DateTimeField(null=True, blank=True, help_text="Hotel subscription/license expiry date")
    social_links = models.JSONField(
        default=dict,
        blank=True,
        help_text="Social media links as JSON (e.g., {'facebook': 'url', 'instagram': 'url'})",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_hotels",
        help_text="User who created this hotel",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Hotel"
        verbose_name_plural = "Hotels"

    def __str__(self):
        return self.name
