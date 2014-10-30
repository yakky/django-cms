# -*- coding: utf-8 -*-
from django.core.urlresolvers import reverse
from django.db import models
from django.utils.translation import ugettext_lazy as _
from cms.models import CMSPlugin
from cms.utils.compat.dj import python_2_unicode_compatible
from cms.utils.copy_plugins import copy_plugins_to

@python_2_unicode_compatible
class BlueprintPluginModel(CMSPlugin):
    name = models.CharField(_(u'Name'), max_length=255)

    class Meta:
        app_label = 'cms'
        verbose_name = _(u'Blueprint')
        verbose_name_plural = _(u'Blueprints')

    def __str__(self):
        return self.name

    def copy_to(self, placeholder, language):
        copy_plugins_to(self.placeholder_ref.get_plugins(), placeholder, to_language=language)

    def copy_from(self, placeholder, language):
        copy_plugins_to(placeholder.get_plugins(language), self.placeholder_ref, to_language=self.language)

    def move_to(self, placeholder, language):
        for plugin in self.placeholder_ref.get_plugins():
            plugin.placeholder = placeholder
            plugin.language = language
            plugin.save()

    def move_from(self, placeholder, language):
        for plugin in placeholder.get_plugins():
            plugin.placeholder = self.placeholder_ref
            plugin.language = language
            plugin.save()

    @property
    def move_url(self):
        return reverse('admin:cms_apply_blueprint',)