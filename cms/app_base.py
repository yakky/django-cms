# -*- coding: utf-8 -*-
class CMSApp(object):
    name = None
    urls = None
    menus = []
    app_name = None
    app_config = None
    permissions = True
    exclude_permissions = []

    def __new__(cls):
        if cls.app_config:
            if getattr(cls.app_config, 'cmsapp', None) and cls.app_config.cmsapp.__name__ != cls.__name__:
                raise RuntimeError(
                    'Only one AppHook per AppHookConfiguration must exists.\n'
                    'AppHook %s already defined for %s AppHookConfig' % (
                        cls.app_config.cmsapp.__name__, cls.app_config.__name__
                    )
                )
            cls.app_config.cmsapp = cls
        return super(CMSApp, cls).__new__(cls)

    def get_configs(self):
        raise NotImplemented('Configurable AppHooks must implement this method')

    def get_config(self, namespace):
        raise NotImplemented('Configurable AppHooks must implement this method')

    def get_config_add_url(self):
        raise NotImplemented('Configurable AppHooks must implement this method')
