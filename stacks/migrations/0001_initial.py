# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Stack'
        db.create_table('stacks_stack', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(default='', max_length=255, blank=True)),
            ('code', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('language', self.gf('django.db.models.fields.CharField')(default='en', max_length=10)),
            ('content', self.gf('django.db.models.fields.related.ForeignKey')(related_name='stacks_contents', null=True, to=orm['cms.Placeholder'])),
        ))
        db.send_create_signal('stacks', ['Stack'])

        # Adding unique constraint on 'Stack', fields ['code', 'language']
        db.create_unique('stacks_stack', ['code', 'language'])


    def backwards(self, orm):
        # Removing unique constraint on 'Stack', fields ['code', 'language']
        db.delete_unique('stacks_stack', ['code', 'language'])

        # Deleting model 'Stack'
        db.delete_table('stacks_stack')


    models = {
        'cms.placeholder': {
            'Meta': {'object_name': 'Placeholder'},
            'default_width': ('django.db.models.fields.PositiveSmallIntegerField', [], {'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'slot': ('django.db.models.fields.CharField', [], {'max_length': '50', 'db_index': 'True'})
        },
        'stacks.stack': {
            'Meta': {'unique_together': "(('code', 'language'),)", 'object_name': 'Stack'},
            'code': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'content': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'stacks_contents'", 'null': 'True', 'to': "orm['cms.Placeholder']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'default': "'en'", 'max_length': '10'}),
            'name': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '255', 'blank': 'True'})
        }
    }

    complete_apps = ['stacks']