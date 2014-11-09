from django.test.simple import DjangoTestSuiteRunner
from cms.utils.compat.dj import force_unicode
import operator
import time
from django.utils.unittest import TestSuite


TIMINGS = {}

def time_it(func):
    def _inner(*args, **kwargs):
        start = time.time()
        func(*args, **kwargs)
        end = time.time()

        TIMINGS[force_unicode(func)] = end - start
    return _inner


class CmsTestSuiteRunner(DjangoTestSuiteRunner):

    def teardown_databases(self, old_config, **kwargs):
        """
        Destroys all the non-mirror databases.
        """
        old_names, mirrors = old_config
        for connection, old_name, destroy in old_names:
            if destroy:
                if connection.settings_dict['ENGINE'] == 'django.db.backends.mysql':
                    connection.cursor().execute('SET GLOBAL max_allowed_packet=104857600;')
                connection.creation.destroy_test_db(old_name, self.verbosity)


class TimingSuite(TestSuite):
    def addTest(self, test):
        test = time_it(test)
        super(TimingSuite, self).addTest(test)


class TimedTestRunner(DjangoTestSuiteRunner):
    def build_suite(self, test_labels, extra_tests=None, **kwargs):
        suite = super(TimedTestRunner, self).build_suite(test_labels, extra_tests, **kwargs)
        return TimingSuite(suite)

    def teardown_test_environment(self, **kwargs):
        super(TimedTestRunner, self).teardown_test_environment(**kwargs)
        by_time = sorted(
                TIMINGS.items(),
                key=operator.itemgetter(1),
                reverse=True)[:10]
        print(u"Ten slowest tests:")
        for func_name, timing in by_time:
            print(u"{t:.2f}s {f}".format(f=func_name, t=timing))
