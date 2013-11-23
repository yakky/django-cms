# -*- coding: utf-8 -*-
from __future__ import with_statement
from django.core.urlresolvers import resolve

from cms.api import create_page
from cms.test_utils.testcases import CMSTestCase
from cms.test_utils.util.context_managers import SettingsOverride
from cms.utils import urlutils
from cms.utils.page_resolver import get_page_from_request
from cms.views import details


class UrlutilsTestCase(CMSTestCase):
    def test_levelize_path(self):
        path = '/application/item/new'
        output = ['/application/item/new', '/application/item', '/application']
        self.assertEqual(urlutils.levelize_path(path), output)
        
    def test_urljoin(self):
        self.assertEqual('a/b/c/', urlutils.urljoin('a', 'b', 'c'))
        self.assertEqual('a/b/c/', urlutils.urljoin('a', '//b//', 'c'))
        self.assertEqual('a/', urlutils.urljoin('a', ''))

    def test_url_regexp(self):
        """
        Tests for correct urlconf resolution for plain ASCII and Unicode slugs
        """
        slug1 = u'test-page'
        slug2 = u'unicodè'
        home = create_page('home', 'nav_playground.html', 'en',
                           published=True)
        page1 = create_page('test page', 'nav_playground.html', 'en',
                            slug=slug1, published=True, parent=home)
        page2 = create_page(u'unicode page', 'nav_playground.html', 'en',
                            slug=slug2, published=True, parent=home)

        testurl1 = u'/en/%s/' % slug1
        resolved = resolve(testurl1)
        page = get_page_from_request(self.get_request(testurl1))
        self.assertEqual(resolved.func, details)
        self.assertEqual(resolved.kwargs['slug'], slug1)
        self.assertEqual(page.get_path(), slug1)

        testurl2 = u'/en/%s/' % slug2
        resolved = resolve(testurl2)
        page = get_page_from_request(self.get_request(testurl2))
        self.assertEqual(resolved.func, details)
        self.assertEqual(resolved.kwargs['slug'], slug2)
        self.assertEqual(page.get_path(), slug2)

    def test_is_media_url(self):
        with SettingsOverride(MEDIA_URL='/media/'):
            request = self.get_request('/media/')
            self.assertTrue(urlutils.is_media_request(request))
            request = self.get_request('/no-media/')
            self.assertFalse(urlutils.is_media_request(request))
        with SettingsOverride(MEDIA_URL='http://testserver2.com/'):
            request = self.get_request('/')
            self.assertFalse(urlutils.is_media_request(request))
        with SettingsOverride(MEDIA_URL='http://testserver/media/'):
            request = self.get_request('/media/')
            self.assertTrue(urlutils.is_media_request(request))
            request = self.get_request('/no-media/')
            self.assertFalse(urlutils.is_media_request(request))
