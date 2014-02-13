# -*- coding: utf-8 -*-
from cms.toolbar_base import CMSToolbar
from cms.toolbar_pool import toolbar_pool
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _



@toolbar_pool.register
class Example1Toolbar(CMSToolbar):

    def populate(self):
        admin_menu = self.toolbar.get_or_create_menu("placeholderapp", _('Placeholderapp'))
        url = reverse('admin:placeholderapp_example1_changelist')
        admin_menu.add_modal_item(_('Example1 list'), url=url)
        url = reverse('admin:placeholderapp_example1_add')
        admin_menu.add_modal_item(_('Add Example1'), url=url)