# Generated manually for changing hotel relationship to many-to-many

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_account_hotel_account_is_hotel_admin"),
        ("hotels", "0002_hotel_active_until_hotel_cover_hotel_image_and_more"),
    ]

    operations = [
        # Add the new many-to-many field
        migrations.AddField(
            model_name="account",
            name="hotels",
            field=models.ManyToManyField(
                blank=True,
                help_text="Hotels this user belongs to and can manage",
                related_name="users",
                to="hotels.hotel",
            ),
        ),
        # Remove the old foreign key field
        migrations.RemoveField(
            model_name="account",
            name="hotel",
        ),
        # Remove the hotel admin field
        migrations.RemoveField(
            model_name="account",
            name="is_hotel_admin",
        ),
    ]
