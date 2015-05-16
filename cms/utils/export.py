# -*- coding: utf-8 -*-
try:
    from collections import OrderedDict
except ImportError:
    from django.utils.datastructures import SortedDict as OrderedDict

from django.contrib.sites.models import Site
from cms.api import create_page, create_title, add_plugin



def export_pages(root):
    data = OrderedDict()
    data[root.pk] = root.as_data()
    for child in root.get_descendants():
        data[child.pk] = child.as_data()
    return data

def import_pages(data, root=None):
    imported = OrderedDict()
    for original_pk, page in data.items():
        first = True
        page_obj = None
        for language, title in page['titles'].items():
            if first:
                page_data = dict(
                    title=title['title'],
                    template=page['template'],
                    language=language,
                    menu_title=title['menu_title'],
                    page_title=title['page_title'],
                    slug=title['slug'],
                    apphook=page['application_urls'],
                    apphook_namespace=page['application_namespace'],
                    redirect=title['redirect'],
                    meta_description=title['meta_description'],
                    created_by=page['created_by'],
                    changed_by=page['changed_by'],
                    publication_date=page['publication_date'],
                    publication_end_date=page['publication_end_date'],
                    changed_date=page['changed_date'],
                    in_navigation=page['in_navigation'],
                    soft_root=page['soft_root'],
                    reverse_id=page['reverse_id'],
                    navigation_extenders=page['navigation_extenders'],
                    site=Site.objects.get(pk=page['site_id']),
                    login_required=page['login_required'],
                    limit_visibility_in_menu=page['limit_visibility_in_menu'],
                    xframe_options=page['xframe_options'],
                )
                if title['has_url_overwrite']:
                    page_data['overwrite_url'] = title['path']
                if page['parent_id']:
                    page_data['parent'] = imported[page['parent_id']]
                page_obj = create_page(**page_data)
                page_obj.creation_date = page['creation_date']
                page_obj.save()
                first = False
                imported[original_pk] = page_obj
            else:
                title_data = dict(
                    language=language,
                    title=title['title'],
                    page=page_obj,
                    menu_title=title['menu_title'],
                    page_title=title['page_title'],
                    slug=title['slug'],
                    redirect=title['redirect'],
                    meta_description=title['meta_description'],
                )
                if title['has_url_overwrite']:
                    title_data['overwrite_url'] = title['path']
                title_obj = create_title(**title_data)
                title_obj.creation_date = page['creation_date']
                title_obj.save()

        for placeholder, plugins in page['placeholders'].items():
            plugin_tree = OrderedDict()
            placeholder_obj = page_obj.placeholders.get(slot=placeholder)
            for plugin in plugins:
                plugin_data = dict(
                    placeholder=placeholder_obj,
                    plugin_type=plugin['plugin_type'],
                    language=plugin['language']
                )
                excluded = ('changed_date', 'language', 'numchild', 'creation_date', 'parent_id',
                            'depth', 'cmsplugin_ptr_id', 'position', 'path', 'id',
                            'plugin_type')

                if plugin['parent_id']:
                    plugin_data['target'] = plugin_tree[plugin['parent_id']]
                for attr in plugin:
                    if attr not in excluded:
                        plugin_data[attr] = plugin[attr]
                new_plugin = add_plugin(**plugin_data)
                plugin_tree[plugin['cmsplugin_ptr_id']] = new_plugin
