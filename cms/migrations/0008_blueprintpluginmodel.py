# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0007_auto_20141028_1559'),
    ]

    operations = [
        migrations.CreateModel(
            name='BlueprintPluginModel',
            fields=[
                ('cmsplugin_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='cms.CMSPlugin')),
                ('name', models.CharField(max_length=255)),
            ],
            options={
            },
            bases=('cms.cmsplugin',),
        ),
    ]
