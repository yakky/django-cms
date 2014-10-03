# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0003_auto_20140926_2347'),
    ]

    operations = [
        migrations.AlterField(
            model_name='page',
            name='template',
            field=models.CharField(default='INHERIT', max_length=100, help_text='The template used to render the content.', verbose_name='template'),
        ),
        migrations.AlterField(
            model_name='usersettings',
            name='language',
            field=models.CharField(max_length=10, help_text='The language for the admin interface and toolbar', verbose_name='Language'),
        ),
    ]
