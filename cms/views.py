# -*- coding: utf-8 -*-
from __future__ import with_statement

from django.conf import settings
from django.contrib.auth.views import redirect_to_login
from django.core.urlresolvers import resolve, Resolver404, reverse
from django.http import HttpResponseRedirect, HttpResponse
from django.utils.http import urlquote
from django.utils.translation import get_language

from cms.apphook_pool import apphook_pool
from cms.appresolver import get_app_urls
from cms.page_rendering import (render_page, _handle_no_page, _get_cache_key, _get_cache_version,
                                _set_cache_version)
from cms.utils import get_language_code, get_language_from_request, get_cms_setting
from cms.utils.i18n import (get_fallback_languages, force_language, get_public_languages,
                            get_redirect_on_fallback, get_language_list,
                            is_language_prefix_patterns_used)
from cms.utils.page_resolver import get_page_from_request


def details(request, slug):
    """
    The main view of the Django-CMS! Takes a request and a slug, renders the
    page.
    """
    from django.core.cache import cache

    if get_cms_setting("PAGE_CACHE") and (
        not hasattr(request, 'toolbar') or (
            not request.toolbar.edit_mode and
            not request.toolbar.show_toolbar and
            not request.user.is_authenticated()
        )
    ):
        cache_content = cache.get(
            _get_cache_key(request),
            version=_get_cache_version()
        )
        if not cache_content is None:
            content, headers = cache_content
            response = HttpResponse(content)
            response._headers = headers
            return response

    # Get a Page model object from the request
    page = get_page_from_request(request, use_path=slug)
    if not page:
        return _handle_no_page(request, slug)
    current_language = request.REQUEST.get('language', None)
    if current_language:
        current_language = get_language_code(current_language)
        if not current_language in get_language_list(page.site_id):
            current_language = None
    if current_language is None:
        current_language = get_language_code(getattr(request, 'LANGUAGE_CODE', None))
        if current_language:
            current_language = get_language_code(current_language)
            if not current_language in get_language_list(page.site_id):
                current_language = None
    if current_language is None:
        current_language = get_language_code(get_language())
    # Check that the current page is available in the desired (current) language
    available_languages = []
    page_languages = list(page.get_languages())
    if hasattr(request, 'user') and request.user.is_staff:
        user_languages = get_language_list()
    else:
        user_languages = get_public_languages()
    for frontend_lang in user_languages:
        if frontend_lang in page_languages:
            available_languages.append(frontend_lang)
    # Check that the language is in FRONTEND_LANGUAGES:
    own_urls = [
        'http%s://%s%s' % ('s' if request.is_secure() else '', request.get_host(), request.path),
        '/%s' % request.path,
        request.path,
    ]
    if not current_language in user_languages:
        #are we on root?
        if not slug:
            #redirect to supported language
            languages = []
            for language in available_languages:
                languages.append((language, language))
            if languages:
                # get supported language
                new_language = get_language_from_request(request)
                if new_language in get_public_languages():
                    with force_language(new_language):
                        pages_root = reverse('pages-root')
                        if hasattr(request, 'toolbar') and request.user.is_staff and request.toolbar.edit_mode:
                            request.toolbar.redirect_url = pages_root
                        elif pages_root not in own_urls:
                            return HttpResponseRedirect(pages_root)
            elif not hasattr(request, 'toolbar') or not request.toolbar.redirect_url:
                _handle_no_page(request, slug)
        else:
            return _handle_no_page(request, slug)
    if current_language not in available_languages:
        # If we didn't find the required page in the requested (current)
        # language, let's try to find a fallback
        found = False
        for alt_lang in get_fallback_languages(current_language):
            if alt_lang in available_languages:
                if get_redirect_on_fallback(current_language) or slug == "":
                    with force_language(alt_lang):
                        path = page.get_absolute_url(language=alt_lang, fallback=True)
                        # In the case where the page is not available in the
                    # preferred language, *redirect* to the fallback page. This
                    # is a design decision (instead of rendering in place)).
                    if hasattr(request, 'toolbar') and request.user.is_staff and request.toolbar.edit_mode:
                        request.toolbar.redirect_url = path
                    elif path not in own_urls:
                        return HttpResponseRedirect(path)
                else:
                    found = True
        if not found and (not hasattr(request, 'toolbar') or not request.toolbar.redirect_url):
            # There is a page object we can't find a proper language to render it
            _handle_no_page(request, slug)

    if apphook_pool.get_apphooks():
        # There are apphooks in the pool. Let's see if there is one for the
        # current page
        # since we always have a page at this point, applications_page_check is
        # pointless
        # page = applications_page_check(request, page, slug)
        # Check for apphooks! This time for real!
        app_urls = page.get_application_urls(current_language, False)
        skip_app = False
        if not page.is_published(current_language) and hasattr(request, 'toolbar') and request.toolbar.edit_mode:
            skip_app = True
        if app_urls and not skip_app:
            app = apphook_pool.get_apphook(app_urls)
            pattern_list = []
            for urlpatterns in get_app_urls(app.urls):
                pattern_list += urlpatterns
            try:
                view, args, kwargs = resolve('/', tuple(pattern_list))
                return view(request, *args, **kwargs)
            except Resolver404:
                pass
                # Check if the page has a redirect url defined for this language.
    redirect_url = page.get_redirect(language=current_language)
    if redirect_url:
        if (is_language_prefix_patterns_used() and redirect_url[0] == "/" and not redirect_url.startswith(
                    '/%s/' % current_language)):
            # add language prefix to url
            redirect_url = "/%s/%s" % (current_language, redirect_url.lstrip("/"))
            # prevent redirect to self

        if hasattr(request, 'toolbar') and request.user.is_staff and request.toolbar.edit_mode:
            request.toolbar.redirect_url = redirect_url
        elif redirect_url not in own_urls:
            return HttpResponseRedirect(redirect_url)

    # permission checks
    if page.login_required and not request.user.is_authenticated():
        return redirect_to_login(urlquote(request.get_full_path()), settings.LOGIN_URL)
    if hasattr(request, 'toolbar'):
        request.toolbar.set_object(page)
    response = render_page(request, page, current_language=current_language, slug=slug)
    return response


def invalidate_cms_page_cache():
    '''
    Invalidates the CMS PAGE CACHE.
    '''

    #
    # NOTE: We're using a cache versioning strategy for invalidating the page
    # cache when necessary. Instead of wiping all the old entries, we simply
    # increment the version number rendering all previous entries
    # inaccessible and left to expire naturally.
    #
    # ALSO NOTE: According to the Django documentation, a timeout value of
    # `None' (in version 1.6+) is supposed to mean "cache forever", however,
    # this is actually only implemented as only slightly less than 30 days in
    # some backends (memcached, in particular). In older Djangos, `None' means
    # "use default value".  To avoid issues arising from different Django
    # versions and cache backend implementations, we will explicitly set the
    # lifespan of the CMS_PAGE_CACHE_VERSION entry to whatever is set in
    # settings.CACHE_DURATIONS['content']. This allows users to adjust as
    # necessary for their backend.
    #
    # To prevent writing cache entries that will live longer than our version
    # key, we will always re-write the current version number into the cache
    # just after we write any new cache entries, thus ensuring that the
    # version number will always outlive any entries written against that
    # version. This is a cheap operation.
    #
    # If there are no new cache writes before the version key expires, its
    # perfectly OK, since any previous entries cached against that version
    # will have also expired, so, it'd be pointless to try to access them
    # anyway.
    #
    version = _get_cache_version()
    _set_cache_version(version + 1)
