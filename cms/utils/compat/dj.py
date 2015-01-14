import re

from django.conf import settings


__all__ = ['get_user_model', 'user_model_label', 'user_related_name',
           'user_related_query_name',
           'python_2_unicode_compatible', 'get_app_paths',
           'is_installed', 'installed_apps'
           ]

# This used to be conditionally checked, this is no longer the case
# Imported here
from django.utils.encoding import python_2_unicode_compatible, force_text  # nopyflakes
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User as OriginalUser

force_unicode = force_text
is_user_swapped = bool(OriginalUser._meta.swapped)
user_model_label = getattr(settings, 'AUTH_USER_MODEL', 'auth.User')
user_related_query_name = "user"
user_related_name = "user_set"


try:  # pragma: no cover
    from django.db.models.loading import get_app_paths
except ImportError:
    from django.db.models.loading import get_apps
    try:
        from django.utils._os import upath
    except ImportError:
        upath = lambda path: path

    def get_app_paths():
        """
        Returns a list of paths to all installed apps.

        Useful for discovering files at conventional locations inside apps
        (static files, templates, etc.)
        """
        app_paths = []
        for app in get_apps():
            if hasattr(app, '__path__'):        # models/__init__.py package
                app_paths.extend([upath(path) for path in app.__path__])
            else:                               # models.py module
                app_paths.append(upath(app.__file__))
        return app_paths

try:  # pragma: no cover
    from django.apps import apps

    def is_installed(app_name):
        return apps.is_installed(app_name)

    def installed_apps():
        return [app.name for app in apps.get_app_configs()]

except ImportError:

    def is_installed(app_name):
        return app_name in settings.INSTALLED_APPS

    def installed_apps():
        return settings.INSTALLED_APPS


def normalize_name(name):
    """
    Converts camel-case style names into underscore separated words. Example::
        >>> normalize_name('oneTwoThree')
        'one_two_three'
        >>> normalize_name('FourFiveSix')
        'four_five_six'
    """
    new = re.sub('(((?<=[a-z])[A-Z])|([A-Z](?![A-Z]|$)))', '_\\1', name)
    return new.lower().strip('_')