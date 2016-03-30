
import os
import sys

script_dir = os.path.dirname(os.path.realpath(__file__))


def get_resource(resource_path):
    """Returns resource's full path from relative path."""
    frozen = getattr(sys, 'frozen', '')

    if not frozen:
        # Go back to level where is static and vendor directories.
        resource_dir = os.path.join(script_dir, os.path.pardir)

    elif frozen in ('dll', 'console_exe', 'windows_exe'):
        # py2exe:
        resource_dir = os.path.dirname(sys.executable)

    elif frozen in ('macosx_app',):
        # py2app:
        # Notes on how to find stuff on MAC, by an expert (Bob Ippolito):
        # http://mail.python.org/pipermail/pythonmac-sig/2004-November/012121.html
        resource_dir = os.environ['RESOURCEPATH']

    return os.path.join(resource_dir, resource_path)
