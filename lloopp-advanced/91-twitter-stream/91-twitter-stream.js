/**
 * Copyright 2015 Natural Intelligence Solutions
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Michael Angelo Ruta (2015)
 *
 **/
 
module.exports = function(RED) {
    "use strict";

    function TwitterStreamNode(n) {
        RED.nodes.createNode(this,n);

        this.topic = n.topic;

        var node = this;

        var Twitter = require('node-tweet-stream'),
            t = new Twitter({
                consumer_key: n.consumer_key,
                consumer_secret: n.consumer_secret,
                token: n.token,
                token_secret: n.token_secret
            });

        RED.httpAdmin.post("/twitter-stream/:id", function(req,res) {
            var node = RED.nodes.getNode(req.params.id);
            if(node) {
                if(n.topic) {
                    t.track(n.topic);
                }
                if(n.location) {
                    t.location(n.location);
                }
              res.send({"success":true,"message":"<strong>Twitter Stream:</strong> started tracking `"+(n.topic || n.location)+"`"});
            }
        });

        t.on('tweet', function (tweet) {
            var msg = {}
            if(tweet.text) {
                msg.payload = tweet
                msg.text = tweet.text
            } else {
                node.error(tweet)
            }
            msg.topic = n.topic
            node.send(msg)
        })

        t.on('error', function (err) {
            node.status({fill:"red",shape:"dot",text:err});
        })

        this.on("input", function(msg) {
            if(msg.track) {
                t.track(msg.track);
            }
            if(msg.location) {
                t.track(msg.location);
            }
            if(msg.untrack) {
                t.untrack(msg.untrack);
            }
        });

        this.on("error", function() {

        });

        this.on("close", function() {

        });
    }

    RED.nodes.registerType("twitter-stream",TwitterStreamNode);

}
