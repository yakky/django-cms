###########################
django CMS acceptance tests
###########################

************
Installation
************

See `django CMS docs for unning and writing tests <http://docs.django-cms.org/en/latest/contributing/testing.html>`_

1. Setting up the project:

    # create a virtual environment
    virtualenv test-django-cms

    # activate it
    cd test-django-cms/
    source bin/activate

    # get django CMS from GitHub
    git clone git@github.com:divio/django-cms.git

    # install the dependencies for testing
    # note that requirements files for other Django versions are also provided
    pip install -Ur django-cms/test_requirements/django-1.6.txt

    # run the test suite
    # note that you must be in the django-cms directory when you do this,
    # otherwise you'll get "Template not found" errors
    cd django-cms

2. Get the latest `Sauce Connect <https://docs.saucelabs.com/reference/sauce-connect/>`_ and extract it to django-cms root folder
3. Go to the extracted directory (for example: ``cd sc-4.3.6-osx``) and run:

    bin/sc -u django-cms -k 06764b40-367e-4182-aefb-6e47baef4ec2 -i 1111

where ``-i`` is tunnel-identifier - it can be changed to any value, but then don't forget to change it while launching tests in step 5 (SAUCE_TUNNEL=1111)

4. When you see "Connection established", you are ready - open the new terminal tab and go to the root folder (``cd ../``)

5. Launch the acceptance tests:

    SAUCE_USERNAME='django-cms' SAUCE_ACCESS_KEY='06764b40-367e-4182-aefb-6e47baef4ec2' SAUCE_TUNNEL=1111 LOCAL_BUILD=887788 python develop.py test cms.ToolbarBasicTests

