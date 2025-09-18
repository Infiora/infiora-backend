from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.db import models


def user_image_path(instance, filename):
    import uuid

    ext = filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    return f"uploads/users/{instance.id}/{filename}"


class Account(AbstractUser, PermissionsMixin):
    image = models.ImageField(upload_to=user_image_path, null=True, blank=True)
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
