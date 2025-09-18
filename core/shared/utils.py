"""
General utility functions that don't fit into specific categories
"""

import os

import yaml
from django.conf import settings
from django.db import transaction


def apply_on_commit(callable_):
    """Apply a callable either immediately or on transaction commit"""
    if settings.USE_ON_COMMIT_HOOK:
        transaction.on_commit(callable_)
    else:
        callable_()


def yaml_coerce(value):
    """Coerce a string value using YAML parsing"""
    if isinstance(value, str):
        return yaml.load(f"dummy: {value}", Loader=yaml.SafeLoader)["dummy"]
    return value


def deep_update(base_dict, update_with):
    """Deep update a dictionary with another dictionary"""
    for key, value in update_with.items():
        if isinstance(value, dict):
            base_dict_value = base_dict.get(key)

            if isinstance(base_dict_value, dict):
                deep_update(base_dict_value, value)
            else:
                base_dict[key] = value
        else:
            base_dict[key] = value

    return base_dict


def get_settings_from_environment(prefix):
    """Get settings from environment variables with a given prefix"""
    prefix_len = len(prefix)
    return {key[prefix_len:]: yaml_coerce(value) for key, value in os.environ.items() if key.startswith(prefix)}
