from django.contrib import admin
from stacks.models import Stack
from cms.admin.placeholderadmin import PlaceholderAdmin

class StackAdmin(PlaceholderAdmin):
    list_display = ('code', 'name',)

admin.site.register(Stack, StackAdmin)
