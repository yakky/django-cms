###########################
django CMS acceptance tests
###########################

**************
How to install
**************

1. Get the latest `Sauce Connect <https://docs.saucelabs.com/reference/sauce-connect/>`_ and extract it to django-cms root folder
2. Go to the extracted directory (for example: ``cd sc-4.3.6-osx``) and run:

    bin/sc -u django-cms -k 06764b40-367e-4182-aefb-6e47baef4ec2 -i 1111

3. When you see "Connection established", you are ready - open the new terminal tab and go to the root folder (``cd ../``)

4. Launch the acceptance tests:

    SAUCE_USERNAME='django-cms' SAUCE_ACCESS_KEY='06764b40-367e-4182-aefb-6e47baef4ec2' SAUCE_TUNNEL=1111 LOCAL_BUILD=887788 python develop.py test cms.ToolbarBasicTests

