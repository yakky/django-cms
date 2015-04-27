# -*- coding: utf-8 -*-
from collections import defaultdict
from django.utils.encoding import force_text
from cms.models import Page, CMSPlugin
from cms.api import create_page, create_title, add_plugin
from cms.test_utils.testcases import CMSTestCase
from cms.utils.export import export_pages, import_pages, pretty_print_pages
from cms.page_rendering import render_page


class ExportTest(CMSTestCase):
    pages = {}

    def setUp(self):
        self.pages['1'] = create_page(title='page1', language='en', template='col_two.html', published=True)
        create_title(title='page1', language='fr', page=self.pages['1'])
        self.pages['2'] = create_page(title='page2', language='en', template='col_two.html', published=True, parent=self.pages['1'])
        create_title(title='page2', language='fr', page=self.pages['2'])
        self.pages['3'] = create_page(title='page3', language='en', template='col_two.html', published=True, parent=self.pages['2'])
        create_title(title='page3', language='fr', page=self.pages['3'])
        self.pages['4'] = create_page(title='page4', language='en', template='col_two.html', published=True, parent=self.pages['2'])
        create_title(title='page4', language='fr', page=self.pages['4'])
        self.pages['5'] = create_page(title='page5', language='en', template='col_two.html', published=True, parent=self.pages['1'])
        create_title(title='page5', language='fr', page=self.pages['5'])

        for page in self.pages.values():
            for lang in page.get_languages():
                add_plugin(placeholder=page.placeholders.get(slot='col_left'), plugin_type='TextPlugin', body='some text', language=lang)
                link = add_plugin(placeholder=page.placeholders.get(slot='col_left'), plugin_type='LinkPlugin', url='http://www.example.com', language=lang)
                add_plugin(placeholder=page.placeholders.get(slot='col_left'), plugin_type='TextPlugin', body='link text', language=lang, target=link)
                add_plugin(placeholder=page.placeholders.get(slot='col_sidebar'), plugin_type='TextPlugin', body='sidebar text', language=lang)
                link = add_plugin(placeholder=page.placeholders.get(slot='col_sidebar'), plugin_type='LinkPlugin', url='http://www.example.com', language=lang)
                add_plugin(placeholder=page.placeholders.get(slot='col_sidebar'), plugin_type='TextPlugin', body='sidebar link', language=lang, target=link)
                page.publish(lang)

        for key, page in self.pages.items():
            self.pages[key] = page.reload()

    def test_export_data(self):
        renders = defaultdict(list)
        new_renders = defaultdict(list)

        original = list(Page.objects.drafts())
        data = export_pages(self.pages['1'])

        for page in original:
            for lang in page.get_languages():
                request = self.get_request(page.get_path(lang), language=lang, page=page)
                renders[lang].append(render_page(request, page, lang, page.get_slug(lang)).render())

        Page.objects.all().delete()
        CMSPlugin.objects.all().delete()

        import_pages(data)

        imported = list(Page.objects.drafts())
        asserted_properties = ('creation_date', 'path', 'depth', 'changed_by', 'template',
                               'soft_root', 'application_urls', 'numchild')
        for idx, page in enumerate(original):
            for property in asserted_properties:
                self.assertEqual(getattr(page, property), getattr(imported[idx], property))
            self.assertListEqual(page.get_languages(), imported[idx].get_languages())

        for page in imported:
            for lang in page.get_languages():
                page.publish(lang)
        for page in imported:
            for lang in page.get_languages():
                request = self.get_request(page.get_path(lang), language=lang, page=page)
                new_renders[lang].append(render_page(request, page, lang, page.get_slug(lang)).render())
        for idx, page in enumerate(original):
            for lang in page.get_languages():
                self.assertEqual(renders[lang][idx].content, new_renders[lang][idx].content)