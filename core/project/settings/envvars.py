from dotenv import load_dotenv

from core.general.utils.collections import deep_update
from core.general.utils.settings import get_settings_from_environment

# Load environment variables from .env file
load_dotenv()

deep_update(globals(), get_settings_from_environment(ENVVAR_SETTINGS_PREFIX))  # type: ignore # noqa: F821
