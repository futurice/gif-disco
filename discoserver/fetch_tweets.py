"""
Fetch latest tweets.
"""

import json
import os
import py_twitter_package.twitter as twitter
import time
import sys


script_dir, filename = os.path.split(os.path.abspath(__file__))
config_file_path = os.path.join(script_dir, 'settings.json')
config = json.loads(open(config_file_path).read())

# Your twitter app's secret keys.
consumer_key = config['consumer_key']
consumer_secret = config['consumer_secret']
access_token_key = config['access_token_key']
access_token_secret = config['access_token_secret']


class TwitterAPI(object):
    def __init__(self):
        self._api = twitter.Api(consumer_key=consumer_key,
                                consumer_secret=consumer_secret,
                                access_token_key=access_token_key,
                                access_token_secret=access_token_secret)

    def user_tweets(self, user_name, count=10):
        json_tweets = self._api.GetUserTimeline(user_name, count=count,
                                                return_json=True)

        return json_tweets

    def search_tweets(self, query, count=10):
        tweets = json.loads(self._api.GetSearch(term=query, count=count,
                                                include_entities=True,
                                                return_json=True))

        return json.dumps(tweets['statuses'])


def write_tweets_to_file(file_path, json_tweets):
    f = open(file_path, 'w')
    f.write(json_tweets)
    f.close()


def main():
    # Change directory to first commandline parameter
    if len(sys.argv) > 1:
        os.chdir(sys.argv[1])

    api = TwitterAPI()

    tweets = '[]'
    retries = 3
    while tweets.strip() == '[]' and retries > 0:
        tweets = api.search_tweets('#TampereHuone')

        if tweets == '[]':
            time.sleep(5)

        retries -= 1

    if retries > 0:
        write_tweets_to_file('hashtag_tamperehuone.json', tweets)


if __name__ == '__main__':
    main()
