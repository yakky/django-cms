from django.db import models
from cms.models.fields import PlaceholderField
from cms.utils import placeholder
from django.utils.translation import ugettext_lazy as _
from cms.models.pluginmodel import CMSPlugin

class Stack(models.Model):
    code = models.CharField(max_length=255, unique=True, db_index=True, primary_key=True)
    name = models.CharField(max_length=255, blank=True, default='')
    content = PlaceholderField(slotname='stack_content',
                                verbose_name=_('content'),
                                actions=placeholder.MLNGPlaceholderActions,
                                related_name='stacks_contents')
    class Meta:
        verbose_name = _('stack')
        verbose_name_plural = _('stacks')
        app_label = 'cms'

class StackLink(CMSPlugin):
    stack = models.ForeignKey(Stack, verbose_name=_("stack"))

