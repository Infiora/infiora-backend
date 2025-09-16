from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.db import models


class Account(AbstractUser, PermissionsMixin):
    image = models.ImageField(upload_to="user/images/", null=True, blank=True)
    email = models.EmailField(unique=True, blank=False, null=False)
    is_email_verified = models.BooleanField(default=False)
