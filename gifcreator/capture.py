

import glob
import os

import fabric.context_managers as ctx
from fabric.api import local


script_dir = os.path.dirname(os.path.realpath(__file__))
os.chdir(script_dir)

settings = {
    # Where the gif should be moved when created
    'output_dir': '../accepterserver/static/img',

    # Final gif's size. <width>x<height>
    'output_size': '320x240',

    # Rotate parameter given to convert command
    # Camera is sideways because green blanket's aspect ratio is like this:
    #  -----
    # |     |
    # |     |
    # |     |
    #  -----
    'rotate': '270',

    # Crop parameter given to Imagemagick's convert command
    # Image edges should be cropped if the camera view goes outside green
    # blanket. Example: '319x239+0+0'  format WxH+X+Y
    # Cropping is done after rotating, beware that image dimensions change in
    # rotation
    # http://www.imagemagick.org/Usage/crop/#crop
    'crop': None, #'200x320+10+0',

    # Use wacaw -L to list available camera inputs. In OS X 0 is usually
    # iSight, and 1 is USB web cam. It might change though.
    'camera_input': '1',
  
    # Select capture tool from the cmds list below
    'capture_cmd': 'streamer'
}

cmds = {
    # AVFoundation is available on Mac OS X 10.7 (Lion) and later.
    'avfoundation': {
      'cmd': 'ffmpeg -f avfoundation -framerate 30 -i "{camera_input}:none" -video_size {output_size} -t 4 -y preview.{extension}',
      'extension': 'mpg'
    },
  
    # Wacaw needs to be installed separately for Mac OS
    'wacaw': {
      'cmd': 'wacaw -d {camera_input} -i {camera_input} --video --duration 4 --width {width} --height {height} preview',
      'extension': 'avi'
    },
    
    # Streamer can be used for at least on Ubuntu.
    'streamer': {
      'cmd': 'streamer -q -c /dev/video{camera_input} -f rgb24 -r 7 -t 00:00:06 -o preview.{extension}',
      'extension': 'avi'
    }
}

def main():
    clean()
    print('capture video')
    capture_video()
    print('split video')
    split_video_to_frames()
    print('remove background')
    remove_green_from_frames()
    print('create atlas')
    create_atlas()
    print('create gif')
    create_gif()

def clean():
    with ctx.settings(warn_only=True):
        local('rm frames/*.png')

def capture_video():
    w, h = settings['output_size'].split('x')
    cmd = cmds[settings['capture_cmd']]['cmd'];
    ext = cmds[settings['capture_cmd']]['extension'];
    local(cmd.format(width=w, height=h, extension=ext, **settings))

def split_video_to_frames():
    cmd = r'ffmpeg -i "preview.{extension}" -an -ss 00:00:01.50 -r 7 -f image2 -s {output_size} "frames/preview%4d.png"'
    ext = cmds[settings['capture_cmd']]['extension'];
    local(cmd.format(extension=ext, **settings))


def remove_green_from_frames():
    for filename in glob.glob('frames/*.png'):
        local('python remove_green.py "%s"' % filename)
        cmd = 'convert -rotate {rotate} -gravity South '

        if settings['crop'] is not None:
            cmd += '-crop {crop} '

        cmd += '%s %s' % (filename, filename)
        local(cmd.format(**settings))


def create_gif():
    cmd = 'convert ' \
          '+repage ' \
          '-delay 12 ' \
          '-loop 0 ' \
          '-dispose Background ' \
          'frames/*.png ' \
          '-trim ' \
          '-layers TrimBounds ' \
          '-duplicate 1,-2-0 ' \
          '-quiet ' \
          '"{output_dir}/preview.gif"'
    local(cmd.format(**settings))

def create_atlas():
    cmd = 'montage frames/preview00[0-1][1-9].png -tile 5x4 -geometry 240x320+0+0 -background transparent {output_dir}/atlas.png'
    local(cmd.format(**settings))

if __name__ == '__main__':
    main()
