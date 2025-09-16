"""
Django settings module selector.

This module automatically imports the appropriate settings based on the
DJANGO_SETTINGS_MODULE environment variable or defaults to dev.
"""

import os

# Determine which settings module to use
settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', 'core.settings.dev')

if settings_module.endswith('.prod'):
    from .prod import *
elif settings_module.endswith('.test'):
    from .test import *
elif settings_module.endswith('.dev'):
    from .dev import *
else:
    # Default to dev if no specific module is set
    from .dev import *