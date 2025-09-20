from django.contrib import admin

from .models import Account


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "first_name", "last_name", "is_active", "is_staff", "is_superuser")
    list_filter = ("is_active", "is_staff", "is_superuser", "date_joined")
    search_fields = ("username", "email", "first_name", "last_name")
    filter_horizontal = ("hotels",)  # Use horizontal filter for better many-to-many UI
    fieldsets = (
        ("User Information", {"fields": ("username", "email", "first_name", "last_name", "image")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        (
            "Hotels Access",
            {"fields": ("hotels",), "description": "Select which hotels this user can access and manage."},
        ),
        (
            "Metadata",
            {"fields": ("created_by", "is_email_verified", "date_joined", "last_login"), "classes": ("collapse",)},
        ),
    )
    readonly_fields = ("date_joined", "last_login")
