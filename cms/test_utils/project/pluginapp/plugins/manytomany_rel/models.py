from django.db import models

from cms.models import CMSPlugin

from cms.test_utils.project.pluginapp.models import Section


class ArticlePluginModel(CMSPlugin):
    title = models.CharField(max_length=50)
    sections =  models.ManyToManyField(Section)
    
    def __unicode__(self):
        return self.title
    
    def copy_relations(self, oldinstance):
        self.sections = oldinstance.sections.all()


class TestPluginModel(models.Model):
    title = models.CharField(max_length=50)
    article_plugin = models.ForeignKey(ArticlePluginModel)

    def __unicode__(self):
        return self.title

    def copy_relations(self, oldinstance):
        self.article_plugin = oldinstance.article_plugin.all()