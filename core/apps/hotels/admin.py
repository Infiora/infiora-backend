from django.contrib import admin
from django.contrib.auth import get_user_model

from .models import Hotel

User = get_user_model()


class HotelUsersInline(admin.TabularInline):
    """Inline to manage hotel-user relationships"""

    model = User.hotels.through
    extra = 1
    verbose_name = "Hotel User"
    verbose_name_plural = "Hotel Users"


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "address",
        "phone",
        "email",
        "get_user_count",
        "active_until",
        "created_at",
        "updated_at",
    )
    list_filter = ("created_at", "updated_at", "active_until")
    search_fields = ("name", "address", "phone", "email", "description")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "name",
                    "description",
                    "address",
                    "phone",
                    "email",
                    "website",
                )
            },
        ),
        (
            "Media",
            {
                "fields": (
                    "image",
                    "cover",
                )
            },
        ),
        (
            "Management",
            {
                "fields": (
                    "active_until",
                    "note",
                )
            },
        ),
        (
            "Social Links",
            {
                "fields": ("social_links",),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )
    ordering = ("-created_at",)
    inlines = [HotelUsersInline]

    def get_user_count(self, obj):
        """Display the number of users assigned to this hotel"""
        return obj.users.count()

    get_user_count.short_description = "Users Count"  # type: ignore
