# -*- coding: utf-8 -*-
import hashlib

from django.conf import settings
from django.core.urlresolvers import resolve, Resolver404
from django.http import Http404
from django.template import RequestContext
from django.template.response import TemplateResponse
from django.utils.cache import add_never_cache_headers
from django.utils.encoding import iri_to_uri, force_text
from django.utils.timezone import get_current_timezone_name

from cms.models import Page
from cms.utils import get_template_from_request, get_cms_setting


def render_page(request, page, current_language, slug):
    """
    Renders a page
    """
    template_name = get_template_from_request(request, page, no_current_page=True)
    # fill the context
    context = RequestContext(request)
    context['lang'] = current_language
    context['current_page'] = page
    context['has_change_permissions'] = page.has_change_permission(request)
    context['has_view_permissions'] = page.has_view_permission(request)

    if not context['has_view_permissions']:
        return _handle_no_page(request, slug)

    response = TemplateResponse(request, template_name, context)

    response.add_post_render_callback(_cache_page)

    # Add headers for X Frame Options - this really should be changed upon moving to class based views
    xframe_options = page.get_xframe_options()
    # xframe_options can be None if there's no xframe information on the page
    # (eg. a top-level page which has xframe options set to "inherit")
    if xframe_options == Page.X_FRAME_OPTIONS_INHERIT or xframe_options is None:
        # This is when we defer to django's own clickjacking handling
        return response

    # We want to prevent django setting this in their middlewear
    response.xframe_options_exempt = True

    if xframe_options == Page.X_FRAME_OPTIONS_ALLOW:
        # Do nothing, allowed is no header.
        return response
    elif xframe_options == Page.X_FRAME_OPTIONS_SAMEORIGIN:
        response['X-Frame-Options'] = 'SAMEORIGIN'
    elif xframe_options == Page.X_FRAME_OPTIONS_DENY:
        response['X-Frame-Options'] = 'DENY'
    return response


def _cache_page(response):
    from django.core.cache import cache

    if not get_cms_setting('PAGE_CACHE'):
        return response
    request = response._request
    save_cache = True
    for placeholder in getattr(request, 'placeholders', []):
        if not placeholder.cache_placeholder:
            save_cache = False
            break
    if hasattr(request, 'toolbar'):
        if request.toolbar.edit_mode or request.toolbar.show_toolbar:
            save_cache = False
    if request.user.is_authenticated():
        save_cache = False
    if not save_cache:
        add_never_cache_headers(response)
        return response
    else:
        version = _get_cache_version()
        ttl = get_cms_setting('CACHE_DURATIONS')['content']

        cache.set(
            _get_cache_key(request),
            (response.content, response._headers),
            ttl,
            version=version
        )
        # See note in invalidate_cms_page_cache()
        _set_cache_version(version)


CMS_PAGE_CACHE_VERSION_KEY = get_cms_setting("CACHE_PREFIX") + 'CMS_PAGE_CACHE_VERSION'


def _handle_no_page(request, slug):
    if not slug and settings.DEBUG:
        return TemplateResponse(request, "cms/welcome.html", RequestContext(request))
    try:
        #add a $ to the end of the url (does not match on the cms anymore)
        resolve('%s$' % request.path)
    except Resolver404 as e:
        # raise a django http 404 page
        exc = Http404(dict(path=request.path, tried=e.args[0]['tried']))
        raise exc
    raise Http404('CMS Page not found: %s' % request.path)


def _get_cache_key(request):
    #md5 key of current path
    cache_key = "%s:%d:%s" % (
        get_cms_setting("CACHE_PREFIX"),
        settings.SITE_ID,
        hashlib.md5(iri_to_uri(request.get_full_path()).encode('utf-8')).hexdigest()
    )
    if settings.USE_TZ:
        # The datetime module doesn't restrict the output of tzname().
        # Windows is known to use non-standard, locale-dependant names.
        # User-defined tzinfo classes may return absolutely anything.
        # Hence this paranoid conversion to create a valid cache key.
        tz_name = force_text(get_current_timezone_name(), errors='ignore')
        cache_key += '.%s' % tz_name.encode('ascii', 'ignore').decode('ascii').replace(' ', '_')
    return cache_key


def _get_cache_version():
    from django.core.cache import cache

    '''
    Returns the current page cache version, explicitly setting one if not
    defined.
    '''

    version = cache.get(CMS_PAGE_CACHE_VERSION_KEY)

    if version:
        return version
    else:
        _set_cache_version(1)
        return 1


def _set_cache_version(version):
    '''
    Set the cache version to the specified value.
    '''

    from django.core.cache import cache

    cache.set(
        CMS_PAGE_CACHE_VERSION_KEY,
        version,
        get_cms_setting('CACHE_DURATIONS')['content']
    )