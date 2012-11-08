from cms.plugin_pool import plugin_pool
from cms.plugin_base import CMSPluginBase
from django.utils.translation import ugettext_lazy as _
#from stacks.models import StackLink
from cms.plugins.utils import get_plugins

#class StackPlugin(CMSPluginBase):
#    model = StackLink
#    name = _("Stack")
#
#    render_template = "cms/plugins/stacks.html"
#
#    def render(self, context, instance, placeholder):
#        plugins = get_plugins(context['request'], instance.stack.content)
#        context.update({
#            'object': instance,
#            'placeholder':placeholder,
#            'plugins':plugins,
#        })
#        return context
#
#plugin_pool.register_plugin(StackPlugin)
