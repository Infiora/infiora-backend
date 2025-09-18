from dotenv import load_dotenv

from core.shared.utils import deep_update, get_settings_from_environment

# Load environment variables from .env file
load_dotenv()

deep_update(globals(), get_settings_from_environment(ENVVAR_SETTINGS_PREFIX))  # type: ignore # noqa: F821
