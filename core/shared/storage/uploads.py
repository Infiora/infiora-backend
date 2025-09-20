"""
File upload utilities for generating organized upload paths across apps
"""


def upload_to(instance, filename):
    """
    Upload function that needs to be defined at module level for migrations.
    This is a fallback - should be replaced by generate_upload_path.
    """
    return f"uploads/default/{instance.id}/{filename}"


def generate_upload_path(app_name, field_name):
    """
    Generic upload path function for file uploads across all apps.

    Args:
        app_name (str): Name of the app (e.g., 'users', 'hotels')
        field_name (str): Name of the field (e.g., 'image', 'cover', 'document')

    Returns:
        function: Upload function that generates path: uploads/{app_name}/{instance.id}/{field_name}.ext

    Example:
        image = ImageField(upload_to=generate_upload_path('hotels', 'image'))
        # Generates: uploads/hotels/123/image.jpg
    """

    def upload_to_specific(instance, filename):
        ext = filename.split(".")[-1]
        filename = f"{field_name}.{ext}"
        return f"uploads/{app_name}/{instance.id}/{filename}"

    return upload_to_specific
