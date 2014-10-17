# -*- coding: utf-8 -*-
from django.contrib.sites.models import Site, get_current_site
from cms.models import CMSPlugin, Placeholder
from cms.models.aliaspluginmodel import AliasPluginModel
from cms.models.blueprintpluginmodel import BlueprintPluginModel
from cms.models.placeholderpluginmodel import PlaceholderReference
from cms.plugin_base import CMSPluginBase, PluginMenuItem
from cms.plugin_pool import plugin_pool
from cms.plugin_rendering import render_placeholder
from cms.utils import get_language_list
from cms.utils.conf import get_cms_setting, get_languages
from cms.utils.copy_plugins import copy_plugins_to
from cms.utils.plugins import downcast_plugins, build_plugin_tree, assign_plugins
from cms.utils.urlutils import admin_reverse
from django.conf.urls import patterns, url
from django.http import HttpResponseForbidden, HttpResponseBadRequest, HttpResponse
from django.middleware.csrf import get_token
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext_lazy as _, get_language


class PlaceholderPlugin(CMSPluginBase):
    name = _("Placeholder")
    parent_classes = [0]  # so you will not be able to add it something
    #require_parent = True
    render_plugin = False
    admin_preview = False

    model = PlaceholderReference


plugin_pool.register_plugin(PlaceholderPlugin)


class AliasPlugin(CMSPluginBase):
    name = _("Alias")
    allow_children = False
    model = AliasPluginModel
    render_template = "cms/plugins/alias.html"

    def render(self, context, instance, placeholder):
        context['instance'] = instance
        context['placeholder'] = placeholder
        if instance.plugin_id:
            plugins = instance.plugin.get_descendants().order_by('placeholder', 'path')
            plugins = [instance.plugin] + list(plugins)
            plugins = downcast_plugins(plugins)
            plugins[0].parent_id = None
            plugins = build_plugin_tree(plugins)
            context['plugins'] = plugins
        if instance.alias_placeholder_id:
            content = render_placeholder(instance.alias_placeholder, context)
            context['content'] = mark_safe(content)
        return context

    def get_extra_global_plugin_menu_items(self, request, plugin):
        return [
            PluginMenuItem(
                _("Create Alias"),
                admin_reverse("cms_create_alias"),
                data={'plugin_id': plugin.pk, 'csrfmiddlewaretoken': get_token(request)},
            )
        ]

    def get_extra_placeholder_menu_items(self, request, placeholder):
        return [
            PluginMenuItem(
                _("Create Alias"),
                admin_reverse("cms_create_alias"),
                data={'placeholder_id': placeholder.pk, 'csrfmiddlewaretoken': get_token(request)},
            )
        ]

    def get_plugin_urls(self):
        urlpatterns = [
            url(r'^create_alias/$', self.create_alias, name='cms_create_alias'),
        ]
        urlpatterns = patterns('', *urlpatterns)
        return urlpatterns

    def create_alias(self, request):
        if not request.user.is_staff:
            return HttpResponseForbidden("not enough privileges")
        if not 'plugin_id' in request.POST and not 'placeholder_id' in request.POST:
            return HttpResponseBadRequest("plugin_id or placeholder_id POST parameter missing.")
        plugin = None
        placeholder = None
        if 'plugin_id' in request.POST:
            pk = request.POST['plugin_id']
            try:
                plugin = CMSPlugin.objects.get(pk=pk)
            except CMSPlugin.DoesNotExist:
                return HttpResponseBadRequest("plugin with id %s not found." % pk)
        if 'placeholder_id' in request.POST:
            pk = request.POST['placeholder_id']
            try:
                placeholder = Placeholder.objects.get(pk=pk)
            except Placeholder.DoesNotExist:
                return HttpResponseBadRequest("placeholder with id %s not found." % pk)
            if not placeholder.has_change_permission(request):
                return HttpResponseBadRequest("You do not have enough permission to alias this placeholder.")
        clipboard = request.toolbar.clipboard
        clipboard.cmsplugin_set.all().delete()
        language = get_language()
        if plugin:
            language = plugin.language
        alias = AliasPluginModel(language=language, placeholder=clipboard, plugin_type="AliasPlugin")
        if plugin:
            alias.plugin = plugin
        if placeholder:
            alias.alias_placeholder = placeholder
        alias.save()
        return HttpResponse("ok")


plugin_pool.register_plugin(AliasPlugin)


class BlueprintPlugin(CMSPluginBase):
    name = _("Blueprint")
    allow_children = True
    model = BlueprintPluginModel
    render_template = "cms/plugins/blueprint.html"
    #parent_classes = [0]  # so you will not be able to add it something

    def get_extra_global_plugin_menu_items(self, request, plugin):
        return [
            PluginMenuItem(
                _("Create Blueprint"),
                admin_reverse("cms_create_blueprint"),
                data={'plugin_id': plugin.pk, 'csrfmiddlewaretoken': get_token(request)},
            )
        ]

    def get_extra_placeholder_menu_items(self, request, placeholder):
        return [
            PluginMenuItem(
                _("Create Blueprint"),
                admin_reverse("cms_create_blueprint"),
                data={'placeholder_id': placeholder.pk, 'csrfmiddlewaretoken': get_token(request)},
            )
        ]

    def get_plugin_urls(self):
        urlpatterns = [
            url(r'^create_blueprint/$', self.create_blueprint, name='cms_create_blueprint'),
        ]
        urlpatterns = patterns('', *urlpatterns)
        return urlpatterns

    def create_blueprint(self, request):
        if not request.user.is_staff:
            return HttpResponseForbidden("not enough privileges")
        if not 'plugin_id' in request.POST and not 'placeholder_id' in request.POST:
            return HttpResponseBadRequest("plugin_id or placeholder_id POST parameter missing.")
        plugins = []
        # Get the current plugins
        if 'plugin_id' in request.POST:
            pk = request.POST['plugin_id']
            try:
                plugins = [CMSPlugin.objects.get(pk=pk)]
            except CMSPlugin.DoesNotExist:
                return HttpResponseBadRequest("plugin with id %s not found." % pk)
        # Get the top level plugins in the current placeholder
        if 'placeholder_id' in request.POST:
            pk = request.POST['placeholder_id']
            try:
                plugins = Placeholder.objects.get(pk=pk).get_plugins().filter(level=0)
            except Placeholder.DoesNotExist:
                return HttpResponseBadRequest("placeholder with id %s not found." % pk)
        placeholder, _ = Placeholder.objects.get_or_create(slot=get_cms_setting('BLUEPRINT_PLACEHOLDER'))
        language = get_language_list(get_current_site(request))[0]
        if plugins:
            # Creating the container plugin
            blueprint = BlueprintPluginModel(language=language, placeholder=placeholder, plugin_type="BlueprintPlugin")
            blueprint.save()
            # For every top level plugin all the children is selected
            # and copied to the blueprint placeholder
            # with the blueprint plugins as parent. In this way we
            # recreate the plugin structure but with a blueprint top-level plugin
            # that contains them all
            for plugin in plugins:
                children = plugin.get_descendants(include_self=True).order_by('placeholder', 'tree_id', 'level', 'position')
                children = downcast_plugins(children)
                copy_plugins_to(children, placeholder, language, parent_plugin_id=blueprint.pk)
        return HttpResponse("ok")


plugin_pool.register_plugin(BlueprintPlugin)
