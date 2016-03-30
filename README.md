# GIF Disco

What do John Travolta, Mick Jagger, Uuno Turhapuro and you have in common? Y'all got the moves! GIF Disco is a virtual night club - a cool addition to any party. Take over the dance floor by recording your brilliant moves into an infinitely looping GIF animation. 

![Alt text](gif_disco.gif?raw=true "Party on!")

## Excuse me, what?

With GIF Disco people can record a short video clip of their dance moves and turn it into a GIF animation. The animation will then be placed onto a website, which acts as the dance party.

GIF background removal is based on chroma key technique and requires a solid colour backdrop for the shooting such as a green screen. Additionally, the setup requires a web cam, tripod and some computing power. Best result will be achieved with a proper lighting and a subwoofer and some of the hottest hits of the 90's.

![Alt text](disco_setup.jpg?raw=true "Disco setup")

## Project overview
Project consists of following three components: [Accepter Server](accepterserver), [GIF Creator](gifcreator), [Disco Server](discoserver)

Accepter is the starting point for the dance move capturing. It's kind of like a remote control, which allows users to start recording a clip and later preview the clip and either accept or reject the result.

GIF Creator does all the hard work. It takes the video clip, removes the background frame by frame, duplicates and reverses the frames and converts them into a GIF animation.

Disco Server basically serves the disco website. It shifts people around the dance floor so that everyone gets their chance to shine. It also takes care of the scheduled background changes. There's a special controllable version of the disco site, which allows users to reposition and resize the people on the dance floor.

# Running GIF Disco


** This has been only tested in OS X **

Clean files

    python clean.py

Run Gif Accepter

    cd accepterserver
    python main.py --port 8000


Run Gif Disco Server

    cd discoserver
    python main.py --port 8001


Open `http://<discoserver-ip>:8001/static/control.html` in control computer with Chrome. For projectors etc. viewers use `http://<discoserver-ip>:8001` which will display read-only version of disco.

**control.html has to be opened exactly in one place. Gifs are not added to disco you don't open it and if you open more than one, rotation of gifs will not work correctly**


# Installing everything

Download [wacaw](http://webcam-tools.sourceforge.net/#download) and move it to `/usr/bin/`

Install ImageMagick and gevent globally.

    brew install imagemagick
    brew install libevent



Install Python dependencies. This is recommended to do inside a virtualenv.

    pip install -r requirements.txt


# Installing on Ubuntu

Then inside vagrant box install:

    sudo apt-add-repository ppa:jon-severinsson/ffmpeg
    sudo apt-get update
    sudo apt-get install ffmpeg

    sudo apt-get install git python-pip libevent-dev python-dev libjpeg-dev libfreetype6-dev zlib1g-dev libpng12-dev

    sudo ln -s /usr/lib/x86_64-linux-gnu/libjpeg.so /usr/lib
    sudo ln -s /usr/lib/x86_64-linux-gnu/libfreetype.so /usr/lib
    sudo ln -s /usr/lib/x86_64-linux-gnu/libz.so /usr/lib

    sudo pip install -r requirements.txt
