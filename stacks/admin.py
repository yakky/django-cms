from django.contrib import admin
from stacks.models import Stack
from cms.admin.placeholderadmin import PlaceholderAdmin

class StackAdmin(PlaceholderAdmin):
    list_display = ('name', 'language')
    list_filter = ('language',)
    search_fields = ('name',)

admin.site.register(Stack, StackAdmin)
