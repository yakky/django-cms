from cms.plugin_pool import plugin_pool
from cms.plugin_base import CMSPluginBase
from django.utils.translation import ugettext_lazy as _
from cms.plugins.video import settings
from cms.plugins.video.models import Video
from cms.plugins.video.forms import VideoForm
from stacks.models import StackLink

class StackPlugin(CMSPluginBase):
    model = StackLink
    name = _("Stack")

    render_template = "cms/plugins/stacks.html"

    def render(self, context, instance, placeholder):
        context.update({
            'object': instance,
            'placeholder':placeholder,
        })
        return context

plugin_pool.register_plugin(StackPlugin)
