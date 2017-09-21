"""
WSGI middleware app to serve static files and the controlling system.

WARNING: Do NOT use this as a public web server in any way, this is not safe.
         The static file server has not been built against any threats.
"""

# Futubile backend configs
import api_config

import json
import logging
import mimetypes
import os
import urlparse
import time
import shutil
import subprocess

from poster.encode import multipart_encode
from poster.streaminghttp import register_openers
import urllib2

import path
from settings import settings
from pprint import pformat

script_dir = os.path.dirname(os.path.realpath(__file__))
logger = logging.getLogger(__name__)
browserLogger = logging.getLogger('browser')

HEADERS = [
    ("Cache-Control", "no-cache, no-store, must-revalidate"),
    ("Pragma", "no-cache"),
    ("Expires", "0")
]

register_openers()

def main_app(env, start_response):
    """Provides following features:
    - Serves static files
    - /debug route for mobile debugging
    - /command route for interacting with computer
    """
    request_path = env['PATH_INFO']

    if request_path == '/debug':
        return debug(env, start_response)

    elif request_path == '/settings':
        return get_settings(env, start_response)

    elif request_path == '/get_gif':
        ret, stdout, stderr = run_command(settings['gifScriptCommand'])
        print('STDOUT')
        print('------')
        print(stdout)
        print('STDERR')
        print('------')
        print(stderr)

        if ret != 0:
            response = 'Error'
            start_response('500 OK', HEADERS)
            return [json.dumps(response)]

        preview_path = path.get_resource('static/img/preview.gif')
        if not os.path.isfile(preview_path):
            response = 'Error'
            start_response('500 OK', HEADERS)
            return [json.dumps(response)]

        response = 'OK'
        start_response('200 OK', HEADERS)
        return [json.dumps(response)]

    elif request_path == '/save_gif':
        directory = os.path.abspath(settings['gifsDirectory'])
        atlasDir = os.path.abspath(settings['atlasDirectory'])
        
        code = get_post_data(env)
        
        new_name = str(int(time.time()))
        if len(code) > 0:
            new_name += '_' + code;
        
        atlas_name = new_name + '.png'
        new_name += '.gif'
        
        os.rename(path.get_resource('static/img/preview.gif'),
                  path.get_resource('static/img/%s' % new_name))
        os.rename(path.get_resource('static/img/atlas.png'),
                  path.get_resource('static/img/%s' % atlas_name))

        # Post image to the party app backend
        post_gif('static/img/%s' % new_name, code)
        
        shutil.move(path.get_resource('static/img/%s' % new_name), directory)
        shutil.move(path.get_resource('static/img/%s' % atlas_name), atlasDir)

        response = 'OK'
        start_response('200 OK', HEADERS)
        return [json.dumps(response)]

    # Serve a file if it's found.
    else:
        if request_path == '/':
            request_path = '/static/index.html'

        return file_response(request_path, start_response)


def run_command(command):
    """Runs an command and returns the stdout and stderr as a string.

    Args:
        command: Command to execute in Popen's list format.
                 E.g. ['ls', '..']

    Returns:
        tuple. (return_value, stdout, stderr), where return_value is the
        numerical exit code of process and stdout/err are strings containing
        the output. stdout/err is None if nothing has been output.
    """
    p = subprocess.Popen(command, stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE)
    stdout, stderr = p.communicate()
    return_value = p.wait()
    return return_value, stdout, stderr


def debug(env, start_response):
    """Mobile devices can send debug information with this route"""
    data = get_post_data(env)
    data = urlparse.parse_qs(data)
    browserLogger.info(data)

    start_response('200 OK', HEADERS)
    return ['']


def get_settings(env, start_response):
    start_response('200 OK', [('Content-Type', 'application/json')])
    return [json.dumps(settings)]


# Functions for responding to file requests etc.

def filepath(request_path):
    """Returns full filepath from request path.

    WARNING: This is not safe, one could use .. tricks to get into root path!!
    """
    if request_path.startswith('/'):
        request_path = request_path[1:]

    return path.get_resource(request_path)


def readfile(path):
    if not os.path.isfile(path):
        return None
    return open(path, 'rb').read()


def file_response(request_path, start_response):
    path = filepath(request_path)

    content = readfile(path)
    if content is not None:
        content_type = mimetypes.guess_type(path)[0]
        headers = HEADERS[:]
        headers.append(('Content-Type', content_type))
        start_response('200 OK', headers)
        return [content]

    return notfound(start_response)


def notfound(start_response):
    start_response('404 Not Found', [('Content-Type', 'text/plain')])
    return ['Not found']


def get_post_data(env):
    """Returns POST data as a dict."""
    body = ''
    try:
        length = int(env.get('CONTENT_LENGTH', '0'))
    except ValueError:
        length = 0
    if length != 0:
        body = env['wsgi.input'].read(length)
    return body

def post_gif(filePath, code):
    print('post gif ' + filePath + ':' + code)
    datagen, headers = get_headers(filePath, code)
    headers['x-token'] = api_config.X_TOKEN
    headers['x-gif-api-token'] = api_config.X_GIF_API_TOKEN
    request = urllib2.Request(api_config.ENDPOINT, datagen, headers)
    print urllib2.urlopen(request).read()
    
def get_headers(filePath, code):
    if len(code) > 0:
        return multipart_encode({"code":code, "image": open(filePath, 'rb')})
    else:
        return multipart_encode({"image": open(filePath, 'rb')})
