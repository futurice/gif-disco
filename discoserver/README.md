# Gif Disco

Gif Disco runs a web server.

Make it run
-----------

*The program needs super user privileges because it runs a web server on port 80 and simulates keyboard events.*

First, follow steps from Installing

After you have installed it run:

    sudo python main.py

Then browse to your computer's ip address.


Installing
==========

Requirements:

 * [gevent](http://www.gevent.org/)

OSX
---

Start terminal application and follow instructions.

Install [pip](http://pypi.python.org/pypi/pip) using Homebrew:

    # Python formula installs pip also
    brew install python

Or manually:

    mkdir build
    cd build
    curl -O http://python-distribute.org/distribute_setup.py
    sudo python distribute_setup
    sudo easy_install pip


After that you have to install [libevent](http://libevent.org/).
Note that gevent starts using [libev](http://software.schmorp.de/pkg/libev.html) starting from 1.0 version.

At the time of writing, pip installs gevent which uses libevent.

Installing libevent with Homebrew:

    brew install libevent

Or manually:

**To ease your job, a few of the following commands use a wildcard.
You MUST make sure that before you execute these commands,
you don't have any earlier versions of libevent in your Downloads directory!**

Download the latest stable libevent **.tar.gz** file from http://libevent.org to your Downloads directory and run the following commands:

    mv ~/Downloads/libevent-*-stable.tar.gz .
    tar xvvf libevent-*-stable.tar.gz
    cd libevent-*-stable
    ./configure && make
    sudo make install

At this point you have to choose if you want the installation inside
a virtualenv or not. If you want it, move to [Virtualenv](https://github.com/kimmobrunfeldt/gifdisco#virtualenv).

If you don't care about virtualenv:

    sudo pip install gevent

Linux(Ubuntu and other Debian based)
------------------------------------

Run the following commands in terminal:

    # gevent needs python-dev and libevent
    sudo apt-get install git python-pip python-dev libevent-dev

At this point you have to choose if you want the installation inside
a virtualenv or not. If you want it, move to Virtualenv.

If you don't care about virtualenv:

    sudo pip install gevent


Virtualenv
----------

I recommend to install [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/en/latest/install.html), configure it and use it:

    mkvirtualenv gifdisco
    pip install gevent


Problems
========

    socket.error: [Errno 13] Permission denied: ('0.0.0.0', 80)

**main.py** has to be run as super user.

