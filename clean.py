
import fabric.context_managers as ctx
from fabric.api import local


def main():
    with ctx.settings(warn_only=True):
        local('rm gifcreator/frames/*.png')
        local('rm gifcreator/preview.avi')
        local('python discoserver/clean.py')


if __name__ == '__main__':
    main()
