"""
WSGI middleware app to serve static files and the controlling system.

WARNING: Do NOT use this as a public web server in any way, this is not safe.
         The static file server has not been built against any threats.
"""

import copy
import calendar
import glob
import json
import logging
import mimetypes
import os
import urlparse
import string
import random
import time
from PIL import Image

import path
from settings import settings

script_dir = os.path.dirname(os.path.realpath(__file__))
logger = logging.getLogger(__name__)
browserLogger = logging.getLogger('browser')


GIFS_PATH = path.get_resource('gifs.json')
ATLAS_PATH = path.get_resource('atlas.json')

# Very bad way of saving state in the backend
state = {
    'last_dancer_switch': time.time()
}

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

    # POST /gif
    elif request_path == '/gif':
        data = json.loads(get_post_data(env))
        gifs = read_json(GIFS_PATH)

        # Change gif's position in visible gifs
        for i, gif in enumerate(gifs['visible']):
            if gif['id'] == data['id']:
                gifs['visible'][i]['position'] = data['position']
                gifs['visible'][i]['height'] = data['height']

        # Set gif's possible new size
        gifs['all'][data['id']]['width'] = data['width']
        gifs['all'][data['id']]['height'] = data['height']
        gifs['all'][data['id']]['modified'] = int(time.time())

        # Save state to file
        save_json(GIFS_PATH, gifs)

        start_response('200 OK', [])
        return ['']

    # POST /hide_gif
    elif request_path == '/hide_gif':
        data = json.loads(get_post_data(env))
        gifs = read_json(GIFS_PATH)

        new_visible = [x for x in gifs['visible'] if x['id'] != data['id']]
        gifs['visible'] = new_visible

        # Save state to file
        save_json(GIFS_PATH, gifs)

        start_response('200 OK', [])
        return ['']

    elif request_path == '/tweets':
        tweets = open(path.get_resource('static/hashtag_tamperehuone.json')).read()

        start_response('200 OK', [])
        return [tweets]

    # GET /gifs or /gifs_no_state_change
    elif request_path.startswith('/gifs'):
        gifs = read_json(GIFS_PATH)

        # No state change allowed means that request should not save anything
        # to json state files
        stateChangeAllowed = not request_path.endswith('no_state_change')
        if not stateChangeAllowed:
            data = format_gifs(gifs)
            start_response('200 OK', [])
            return [json.dumps(data)]

        # Check if there are new gifs
        new_gifs_found = False
        gif_files = get_gif_files()
        for gif_file in gif_files:
            gif_id = gif_file['id']

            if gif_id not in gifs['all']:
                # New gif found, add it to all gifs and visible
                logger.info('Adding new gif %s to visible' % gif_file['name'])
                gifs['all'][gif_id] = gif_file
                gifs['all'][gif_id]['modified'] = int(time.time())

                add_new_gif(gifs['visible'], gif_file)
                new_gifs_found = True

        # Check if we should switch dancers
        if (time.time() > state['last_dancer_switch'] + settings['switchDancers'] and
            not new_gifs_found and
            gif_files):

            retries = 50
            nextId = gifs['lastAddedId']
            while retries > 0:
                nextId = get_next_dancer_id(gif_files, nextId)

                if nextId not in [x['id'] for x in gifs['visible']]:
                    break

                retries -= 1

            gifs['lastAddedId'] = nextId
            nextGif = gifs['all'][nextId]

            if retries > 0:
                logging.info('Cycled dancers. Removed %s and added %s' % (gifs['visible'][0]['id'], nextGif['id']))
                add_new_gif(gifs['visible'], nextGif)
                state['last_dancer_switch'] = time.time()

        save_json(GIFS_PATH, gifs)
        start_response('200 OK', [])
        return [json.dumps(format_gifs(gifs))]

    # GET /atlas
    elif request_path == '/atlas':
        atlas = read_json(ATLAS_PATH)

        # Check if there are new files
        new_atlas_found = False
        atlas_files = get_atlas_files()
        for atlas_file in atlas_files:
            atlas_id = atlas_file['id']

            if atlas_id not in atlas['all']:
                # New gif found, add it to all gifs and visible
                logger.info('Adding new atlas %s to visible' % atlas_file['name'])
                atlas['all'][atlas_id] = atlas_file
                atlas['all'][atlas_id]['modified'] = int(time.time())

                add_new_atlas(atlas['visible'], atlas_file)
                new_gifs_found = True

        save_json(ATLAS_PATH, atlas)
        start_response('200 OK', [])
        return [json.dumps(format_gifs(atlas))]

    elif request_path == '/background':

        backgrounds = settings['backgrounds']
        background = '/static/img/disco.jpg'

        for range_start, range_end, img_url in backgrounds:
            if is_time_between(range_start, range_end):
                background = img_url
                break

        start_response('200 OK', [])
        return [json.dumps({"background": background})]

    # Serve a file if it's found.
    else:
        if request_path == '/':
            request_path = '/static/index.html'

        return file_response(request_path, start_response)


def read_json(path):
    return json.loads(open(path).read())


def save_json(path, data, mode='w'):
    f = open(path, mode)
    f.write(json.dumps(data))
    f.close()


def get_next_dancer_id(gif_files, lastAddedId):
    gif_files_rev = [x for x in reversed(gif_files)]

    nextId = gif_files_rev[0]['id']
    if lastAddedId:
        index = None
        for i, gif in enumerate(gif_files_rev):
            if gif['id'] == lastAddedId:
                index = i + 1
                break

        # If index goes out of bounds of last added was not found
        if index >= len(gif_files_rev) or index is None:
            index = 0

        nextId = gif_files_rev[index]['id']

    return nextId

def add_new_gif(visible_gifs, gif):
    """Add new gif to visible gifs, this might push the oldest away
    from visible!
    """
    new_gif = {
        'id': gif['id'],
        'position': {'bottom': 40, 'left': 50},
        'height': gif['height'],
        'added': int(time.time())
    }

    if len(visible_gifs) >= settings['maxVisible']:
        oldest = visible_gifs.pop(0)
        logger.info('Popped oldest %s' % oldest['id'])
        # Take position from the oldest
        new_gif['position'] = oldest['position']
        new_gif['height'] = oldest['height']

    visible_gifs.append(new_gif)

def add_new_atlas(visible_atlas, atlas):
    new_atlas = {
        'id': atlas['id'],
        'height': gif['height'],
        'added': int(time.time())
    }

    if len(visible_atlas) >= settings['maxVirtual']:
        oldest = visible_gifs.pop(0)
        logger.info('Popped oldest %s' % oldest['id'])

    visible_gifs.append(new_gif)


def get_gif_files():
    gif_dir = os.path.abspath(path.get_resource('static/img/gifs'))
    gif_paths = glob.glob(os.path.join(gif_dir, '*.gif'))

    gif_files = []
    for gif_path in gif_paths:
        filename = os.path.basename(gif_path)
        url = os.path.join('/static/img/gifs/', filename)

        name, _ = os.path.splitext(filename)
        name_id = gif_id_from_name(name)

        im = Image.open(gif_path)
        width, height = im.size
        creation_time = os.path.getmtime(gif_path)

        gif_files.append((int(creation_time),
                         {"url": url, "name": name, "id": name_id,
                         "width": width, "height": height}))

    # Sort files based on creation time
    gif_files.sort()
    sorted_gif_files = []
    for creation_time, gif_file in gif_files:
        gif_file['created'] = creation_time
        sorted_gif_files.append(gif_file)

    return sorted_gif_files

def get_atlas_files():
    atlas_dir = os.path.abspath(path.get_resource('static/img/atlas'))
    atlas_paths = glob.glob(os.path.join(atlas_dir, '*.png'))

    atlas_files = []
    for atlas_path in atlas_paths:
        filename = os.path.basename(atlas_path)
        url = os.path.join('/static/img/atlas/', filename)

        name, _ = os.path.splitext(filename)
        name_id = gif_id_from_name(name)

        im = Image.open(atlas_path)
        width, height = im.size
        creation_time = os.path.getmtime(atlas_path)

        atlas_files.append((int(creation_time),
                         {"url": url, "name": name, "id": name_id,
                         "width": width, "height": height}))

    # Sort files based on creation time
    atlas_files.sort()
    sorted_atlas_files = []
    for creation_time, atlas_file in atlas_files:
        atlas_file['created'] = creation_time
        sorted_atlas_files.append(atlas_file)

    return sorted_atlas_files


def format_gifs(gifs):
    data = {'visible': gifs['visible'], 'all': gifs['all']}
    return data

def local_to_utc(t):
    secs = time.mktime(t)
    return time.gmtime(secs)


def utc_to_local(t):
    secs = calendar.timegm(t)
    return time.localtime(secs)


def is_time_between(timestamp1, timestamp2):
    """Checks if the current clock is between timestamps,
    Timestamp format: HH:MM - HH:MM
    """
    hour1, minute1 = map(int, timestamp1.split(':'))
    hour2, minute2 = map(int, timestamp2.split(':'))

    day_add = 0
    # Goes to next day
    if hour2 < hour1:
        day_add = 1

    year, month, day, hour, minute, second, a, b, c = time.localtime()
    range_start = time.mktime((year, month, day, hour1, minute1, 0, a, b, c))
    range_end = time.mktime((year, month, day + day_add, hour2, minute2, 0, a, b, c))

    return range_start <= time.time() < range_end


def gif_id_from_name(name):
    return filter(lambda x: x in string.letters + string.digits, name)


def debug(env, start_response):
    """Mobile devices can send debug information with this route"""
    data = get_post_data(env)
    data = urlparse.parse_qs(data)
    browserLogger.info(data)

    start_response('200 OK', [])
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
        start_response('200 OK', [('Content-Type', content_type)])
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
