
import shutil
import os
import glob


def main():
    script_dir = os.path.dirname(os.path.realpath(__file__))
    os.chdir(script_dir)

    f = open('gifs.json', 'w')
    f.write('{"visible": [], "all": {}, "lastAddedId": null}')
    f.close()

    gif_dir = os.path.join(script_dir, 'static/img/gifs')
    cleaned_gif_dir = os.path.join(script_dir, 'static/img/cleaned-gifs')

    gif_paths = glob.glob(os.path.join(gif_dir, '*.gif'))
    for path in gif_paths:
        print 'Moving %s to %s' % (path, cleaned_gif_dir)
        shutil.move(path, cleaned_gif_dir)


if __name__ == '__main__':
    main()

