"""
Settings should always be accessed via this module.
"""

import sys

try:
    import simplejson as json
except ImportError:
    import json

import path


_error_msg = 'Error reading settings from'


def read_settings():
    file_path = path.get_resource('settings.json')
    try:
        content = open(file_path).read()
    except IOError, e:
        print('%s %s' % (_error_msg, file_path))
        print(e)
        sys.exit(2)

    try:
        settings = json.loads(content)
    except ValueError, e:
        new_msg = "%s %s\n" % (_error_msg, file_path)
        e.message = new_msg + e.message
        raise

    return settings

settings = read_settings()
