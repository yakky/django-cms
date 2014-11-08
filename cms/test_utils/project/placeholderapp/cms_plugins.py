from cms.plugin_pool import plugin_pool
from cms.plugin_base import CMSPluginBase
from django.conf import settings
from djangocms_text_ckeditor.cms_plugins import TextPlugin
from cms.test_utils.project.placeholderapp.models import SampleMultiText


class EmptyPlugin(CMSPluginBase):
    name = "Empty Plugin"
    text_enabled = True
    render_plugin = False

    def render(self, context, instance, placeholder):
        return context

    def icon_src(self, instance):
        return settings.STATIC_URL + u"cms/img/icons/plugins/image.png"


plugin_pool.register_plugin(EmptyPlugin)


class ExtraText(TextPlugin):
    name = u'Extra text'
    model = SampleMultiText
    #fields = ('body',)
plugin_pool.register_plugin(ExtraText)