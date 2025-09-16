import os

from dotenv import load_dotenv

from .misc import yaml_coerce

# Load environment variables from .env file
load_dotenv()


def get_settings_from_environment(prefix):
    prefix_len = len(prefix)
    return {key[prefix_len:]: yaml_coerce(value) for key, value in os.environ.items() if key.startswith(prefix)}
