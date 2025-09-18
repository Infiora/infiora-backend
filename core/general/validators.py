"""
Common validators used across multiple apps
"""

from django.core.validators import RegexValidator

# Password validator - requires at least 8 characters with letters and numbers
password_validator = RegexValidator(
    regex=r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$",
    message="Password must be at least 8 characters long and contain both letters and numbers",
)

# Username validator - allows letters, numbers, dots, dashes, and underscores
username_validator = RegexValidator(
    regex=r"^[a-zA-Z0-9_.-]*$", message="Username can only contain letters, numbers, dots, dashes, and underscores"
)
