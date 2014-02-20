# -*- coding: utf-8 -*-
from django.utils.functional import SimpleLazyObject
from cms.utils.conf import get_cms_setting
import warnings


def cms_settings(request):
    """
    Adds media-related context variables to the context.
    """
    template = ''
    try:
        #template = SimpleLazyObject(lambda: request.current_page.get_template())
        template = request.current_page.get_template()
    except Exception as e:
        print e
        pass
    print template
    return {
        'CMS_MEDIA_URL': get_cms_setting('MEDIA_URL'),
        'CMS_PAGE_TEMPLATE': template,
    }


def media(request):
    warnings.warn('cms.context_processors.media has been deprecated in favor of'
                  'cms.context_processors.cms_settings. Please update your'
                  'configuration', DeprecationWarning)
    return cms_settings(request)
