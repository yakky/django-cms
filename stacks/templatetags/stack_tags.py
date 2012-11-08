from classytags.arguments import Argument, KeywordArgument
from classytags.core import Tag, Options
from django import template
from django.utils.translation import get_language
import re
from django.utils.safestring import mark_safe
from stacks import models as stack_models

register = template.Library()

class StackNode(Tag):
    name = 'stack'
    options = Options(
        Argument('code', required=True),
        KeywordArgument('language', required=False, default=None, ),
        'as',
        Argument('varname', required=False, resolve=False)
    )

    def render_tag(self, context, code, language, varname):
        language = language or get_language()
        stack, created = stack_models.Stack.objects.get_or_create(
            code=code, language=language, defaults={'name': code})
        if not stack.content:
            return ''
        placeholder = stack.content
        rendered_placeholder = mark_safe(placeholder.render(context, None))
        if varname:
            context[varname] = rendered_placeholder
            return ''
        return rendered_placeholder

register.tag(StackNode)