# -*- coding: utf-8 -*-
import tempfile
import codecs

try:
    from cStringIO import StringIO
except:
    from io import StringIO

from django.core.management import call_command

from cms.test_utils.testcases import SettingsOverrideTestCase
from cms.models import Page, Placeholder
from cms.api import add_plugin, create_page


class FixtureTestCase(SettingsOverrideTestCase):

    def test_fixture_load(self):
        """
        This test dumps a live set of pages, cleanup the database and load it
        again.
        This makes fixtures unnecessary and it's easier to maintain.
        """
        output = StringIO()
        dump = tempfile.mkstemp(".json")
        page1 = create_page('test page 1', 'nav_playground.html', 'en',
                            published=True)
        page1_1 = create_page('test page 1_1', 'nav_playground.html', 'en',
                              published=True, parent=page1, slug="foo")
        page1_1_1 = create_page('test page 1_1_1', 'nav_playground.html', 'en',
                                published=True, parent=page1_1, slug="bar")
        page1_1_2 = create_page('test page 1_1_1', 'nav_playground.html', 'en',
                                published=True, parent=page1_1, slug="bar")
        page1_2 = create_page('test page 1_2', 'nav_playground.html', 'en',
                              published=True, parent=page1, slug="bar")
        pages = (page1, page1_1, page1_1_1, page1_1_2, page1_2)
        for i in xrange(1, 3):
            for page in pages:
                placeholder = page.placeholders.all()[0]
                add_plugin(placeholder, 'TextPlugin', 'en', body="Test plugin")
        call_command('dumpdata', 'cms', indent=3, stdout=output)
        Page.objects.all().delete()
        output.seek(0)
        with codecs.open(dump[1], 'w', 'utf-8') as dumpfile:
            dumpfile.write(output.read())

        self.assertEqual(0, Page.objects.count())
        # Transaction disable, otherwise the connection it the test would be
        # isolated from the data loaded in the different command connection
        call_command('loaddata', dump[1], commit=False, stdout=output)
        self.assertEqual(10, Page.objects.count())
