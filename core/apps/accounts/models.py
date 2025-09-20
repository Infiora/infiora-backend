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
    hotels = models.ManyToManyField(
        "hotels.Hotel",
        blank=True,
        related_name="users",
        help_text="Hotels this user belongs to and can manage",
    )
