# -*- coding: utf-8 -*-
from cms.models import Page, Title, CMSPlugin

try:
    from collections import OrderedDict
except ImportError:
    from django.utils.datastructures import SortedDict as OrderedDict


def export_pages(root):
    data = OrderedDict()
    data[root.pk] = root.to_data()
    for child in root.get_descendants():
        data[child.pk] = child.to_data()
    return data

def import_pages(data, root=None):
    imported = OrderedDict()
    for original_pk, page in data.items():
        first = True
        page_obj = None
        for language, title in page['titles'].items():
            if first:
                first = False
                page_obj = Page.from_data(page, title, language, imported)
                imported[original_pk] = page_obj
            else:
                title_obj = Title.from_data(title, language, page_obj)

        for placeholder, plugins in page['placeholders'].items():
            plugin_tree = OrderedDict()
            placeholder_obj = page_obj.placeholders.get(slot=placeholder)
            for plugin in plugins:
                new_plugin = CMSPlugin.from_data(plugin, placeholder_obj, plugin_tree)
                plugin_tree[plugin['cmsplugin_ptr_id']] = new_plugin
