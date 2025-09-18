from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.db import models

from core.shared.storage.uploads import generate_upload_path


class Account(AbstractUser, PermissionsMixin):
    image = models.ImageField(upload_to=generate_upload_path("users", "image"), null=True, blank=True)
    email = models.EmailField(unique=True, blank=False, null=False)
    is_email_verified = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_users",
        help_text="User who created this account",
    )
    hotel = models.ForeignKey(
        "hotels.Hotel",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        help_text="Hotel this user belongs to",
    )
    is_hotel_admin = models.BooleanField(
        default=False,
        help_text="Whether this user is an admin for their hotel",
    )
