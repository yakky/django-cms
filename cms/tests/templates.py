# -*- coding: utf-8 -*-
import os.path
from django.conf import settings
from django.test.utils import override_settings
from django.utils.encoding import force_text
from django.utils.translation import ugettext_lazy as _

from cms import constants
from cms.test_utils.testcases import CMSTestCase
from cms.utils import get_cms_setting


def dynamic_template_dir():
    return "%s/dynamic_templates" % settings.PROJECT_PATH


class TemplatesConfig(CMSTestCase):

    def test_templates(self):
        """
        Tests that the plain CMS_TEMPLATES works as usual
        """
        original_files = [template[0] for template in settings.CMS_TEMPLATES]
        files = [template[0] for template in get_cms_setting('TEMPLATES')]
        if get_cms_setting('TEMPLATE_INHERITANCE'):
            original_files.append(constants.TEMPLATE_INHERITANCE_MAGIC)
        self.assertEqual(len(files), 6)
        self.assertEqual(set(files), set(original_files))

    @override_settings(CMS_TEMPLATES_DIR="%s/custom_templates" % settings.PROJECT_PATH)
    def test_custom_templates(self):
        """
        Test that using CMS_TEMPLATES_DIR both template list and template labels are extracted from the new directory
        """
        template_dir = settings.CMS_TEMPLATES_DIR
        original_labels = [force_text(_(label.split(':')[1].strip())) for label in open(os.path.join(template_dir, 'templates.conf')).readlines()]
        original_files = [label.split(':')[0].strip() for label in open(os.path.join(template_dir, 'templates.conf')).readlines()]
        templates = get_cms_setting('TEMPLATES')
        self.assertEqual(len(templates), 3)
        labels = [force_text(template[1]) for template in templates]
        files = [template[0] for template in templates]
        if get_cms_setting('TEMPLATE_INHERITANCE'):
            original_labels.append(force_text(_(constants.TEMPLATE_INHERITANCE_LABEL)))
            original_files.append(constants.TEMPLATE_INHERITANCE_MAGIC)
        self.assertEqual(set(labels), set(original_labels))
        self.assertEqual(set(files), set(original_files))

    def test_dynamic_template_dir(self):
        from cms import constants
        # Check that no template dir is defined here
        self.assertFalse(get_cms_setting('TEMPLATES_DIR'))

        # What if we define CMS_TEMPLATES_DIR in settings?
        with self.settings(CMS_TEMPLATES_DIR="%s/custom_templates" % settings.PROJECT_PATH):
            self.assertEqual(get_cms_setting('TEMPLATES_DIR'), "%s/custom_templates" % settings.PROJECT_PATH)

        # Define a function to check value at runtime
        with self.settings(CMS_TEMPLATES_LOADER="cms.tests.templates.dynamic_template_dir"):
            self.assertEqual(get_cms_setting('TEMPLATES_DIR'), "%s/dynamic_templates" % settings.PROJECT_PATH)

        # CACHED_TEMPLATES_DIR still in action here
        self.assertEqual(get_cms_setting('TEMPLATES_DIR'), "%s/dynamic_templates" % settings.PROJECT_PATH)
        constants.CACHED_TEMPLATES_DIR = None

    def test_cached_templates_dir(self):
        from cms import constants
        # Check that no template dir is defined here
        self.assertFalse(get_cms_setting('TEMPLATES_DIR'))

        # Push a value into local cache
        constants.CACHED_TEMPLATES_DIR = '/fake/dir'
        self.assertEqual(get_cms_setting('TEMPLATES_DIR'), '/fake/dir')
        # Reset the cache and check we're safe now
        constants.CACHED_TEMPLATES_DIR = None
        self.assertFalse(get_cms_setting('TEMPLATES_DIR'))