/*
 * twitter-entities.js
 * This function converts a tweet with "entity" metadata
 * from plain text to linkified HTML.
 *
 * See the documentation here: http://dev.twitter.com/pages/tweet_entities
 * Basically, add ?include_entities=true to your timeline call
 *
 * Copyright 2010, Wade Simmons
 * Licensed under the MIT license
 * http://wades.im/mons
 *
 * Requires jQuery
 */

function escapeHTML(text) {
    return $('<div/>').text(text).html();
}

function linkify_entities(tweet) {
    if (!(tweet.entities)) {
        return escapeHTML(tweet.text);
    }

    // This is very naive, should find a better way to parse this
    var index_map = {};

    $.each(tweet.entities.urls, function(i,entry) {
        index_map[entry.indices[0]] = [entry.indices[1], function(text) {return "<a href='"+escapeHTML(entry.url)+"'>"+escapeHTML(text)+"</a>";}];
    });

    $.each(tweet.entities.hashtags, function(i,entry) {
        index_map[entry.indices[0]] = [entry.indices[1], function(text) {return "<a href='http://twitter.com/search?q="+escape("#"+entry.text)+"'>"+escapeHTML(text)+"</a>";}];
    });

    $.each(tweet.entities.user_mentions, function(i,entry) {
        index_map[entry.indices[0]] = [entry.indices[1], function(text) {return "<a title='"+escapeHTML(entry.name)+"' href='http://twitter.com/"+escapeHTML(entry.screen_name)+"'>"+escapeHTML(text)+"</a>";}];
    });

    var result = "";
    var last_i = 0;
    var i = 0;

    // iterate through the string looking for matches in the index_map
    for (i=0; i < tweet.text.length; ++i) {
        var ind = index_map[i];
        if (ind) {
            var end = ind[0];
            var func = ind[1];
            if (i > last_i) {
                result += escapeHTML(tweet.text.substring(last_i, i));
            }
            result += func(tweet.text.substring(i, end));
            i = end - 1;
            last_i = end;
        }
    }

    if (i > last_i) {
        result += escapeHTML(tweet.text.substring(last_i, i));
    }

    return result;
}
