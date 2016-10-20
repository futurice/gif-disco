# GIF Disco

What do John Travolta, Mick Jagger, Uuno Turhapuro and you have in common? Y'all got the moves! GIF Disco is a virtual night club – a cool addition to any party. Take over the dance floor by recording your brilliant moves into an infinitely looping GIF animation.

![Alt text](gif_disco.gif?raw=true "Party on!")

## Excuse me, what?

With GIF Disco people can record a short video clip of their dance moves and turn it into a GIF animation. The animation will then be placed onto a website, which acts as the dance party.

GIF background removal is based on chroma key technique and requires a solid colour backdrop for the shooting, such as a green screen. Additionally, the setup requires a web cam, tripod and some computing power. The best result will be achieved with proper lighting, a subwoofer and some of the hottest hits of the 90's.

![Alt text](disco_setup.jpg?raw=true "Disco setup")

## Project overview
The project consists of the following three components:

* [Accepter Server](accepterserver)
* [GIF Creator](gifcreator)
* [Disco Server](discoserver)

Accepter is the starting point for capturing dance moves. It's kind of like a remote control that allows users to start recording a clip, and later preview the clip and either accept or reject the result.

GIF Creator does all the hard work. It takes the video clip, removes the background frame by frame, duplicates and reverses the frames and converts them into a GIF animation.

Disco Server basically serves the disco website. It shifts people around the dance floor so that everyone gets their chance to shine. It also takes care of the scheduled background changes. There's a special, controllable version of the disco site that allows users to reposition and resize the people on the dance floor.

# Running GIF Disco


** This has only been tested on Mac OS X.**

Clean files:

    python clean.py

Run GIF Accepter:

    cd accepterserver
    python main.py --port 8000


Run GIF Disco Server:

    cd discoserver
    python main.py --port 8001


Open `http://<discoserver-ip>:8001/static/control.html` on the control computer with Chrome. For projectors and other viewers, use `http://<discoserver-ip>:8001`, which will display a read-only version of GIF Disco.

**`control.html has to be opened in exactly one place. If you don't open it, GIFs won't get added to the disco, and if you open more than once, the rotation of GIFs will not work correctly!**


# Installing everything

Download [wacaw](http://webcam-tools.sourceforge.net/#download) and move it to `/usr/bin/`

Install ImageMagick and gevent globally:

    brew install imagemagick
    brew install libevent



Install Python dependencies. This is recommended to do inside a virtualenv.

    pip install -r requirements.txt


# Installing on Ubuntu

    sudo add-apt-repository ppa:fnu/main-fnu
    sudo apt-get update
    sudo apt-get install ffmpeg imagemagick

    sudo apt-get install git python-pip libevent-dev python-dev libjpeg-dev libfreetype6-dev zlib1g-dev libpng12-dev

    sudo ln -s /usr/lib/x86_64-linux-gnu/libjpeg.so /usr/lib
    sudo ln -s /usr/lib/x86_64-linux-gnu/libfreetype.so /usr/lib
    sudo ln -s /usr/lib/x86_64-linux-gnu/libz.so /usr/lib

    sudo pip install -r requirements.txt
    
# SSL problem with Ubuntu & Python

    Python may give SSL error for using SSLv3, can be fixed by editing the ssl.py file which gives the error. 
    Find row def get_server_certificate(addr, ssl_version=PROTOCOL_SSLv3, ca_certs=None) near the bottom and change 
    protocol to SSLv23.
    More info regarding this bug can be foudn from https://github.com/gevent/gevent/issues/513
