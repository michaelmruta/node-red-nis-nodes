/**
 * Copyright 2017 Natural Intelligence Solutions
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
 * Author: Michael Angelo Ruta (2017)
 *
 **/

var Crawler = require("js-crawler");
var cheerio = require('cheerio');
var moment = require('moment');
var fs = require('fs');
var crypto = require('crypto');

module.exports = function(RED) {
    "use strict";

    function JsCrawlerNode(n) {
        RED.nodes.createNode(this, n);


        var node = this;

        node.status({});
        
        node.crawler = null;

        this.on('input', function(msg) {
            
            var config = { ignoreRelative: msg.ignoreRelative || n.ignoreRelative, 
                                    depth: msg.depth || n.depth, 
                     maxRequestsPerSecond: msg.maxRequestsPerSecond || n.maxRequestsPerSecond, 
                    maxConcurrentRequests: msg.maxConcurrentRequests || n.maxConcurrentRequests, 
                                userAgent: msg.userAgent || n.userAgent }

            node.crawler = new Crawler().configure(config);
            
            if(msg.topic == "") {
                node.status({});
                if(node.crawler.stop) {
                    node.crawler.stop()
                }
            } else {
                var ctr = 0, found = 0;
                node.status({fill:"blue",shape:"dot",text: "Starting..." });

                node.crawler.crawl({
                        url: msg.topic,
                        success: function(page) {
                            ctr += 1

                            node.status({fill:"blue",shape:"dot",text: "Matches: " + found + ", Crawled: " + ctr + ", Queue: " + node.crawler.workExecutor.queue.length });

                            msg.record = ctr;

                            var $ = cheerio.load(page.body.toString())

                            $(n.queryForPostField).each(function(i, elem) {

                                found += 1

                                var post = cheerio.load($(this).html())

                                if(n.queryForRemovedFields) {
                                    post(n.queryForRemovedFields).remove()
                                }

                                msg.date = post(n.queryForDateField).text()
                                msg.payload = post(n.queryForContentField).text()

                                if (n.removeWhiteSpaces) {
                                    msg.payload = msg.payload.replace(/<\/?[^>]+(>|$)/g, " ")
                                        .replace(/\t/g, "")
                                        .replace(/\n/g, "")
                                        .replace(/\r/g, " ")
                                        .replace("     ", " ")
                                        .replace(/undefined/, "")
                                        .trim();
                                }

                                // remove ordinals
                                // remove time
                                // msg.date = post('.postdate .date').text().replace(/(\d+)(st|nd|rd|th)/, "$1")
                                //                                             .replace(/,\s+(\d+)(\d+):(\d+)(\d+) [AP]M/, "").trim();

                                if (n.queryForDateField) {
                                    if (n.dateFormat) {
                                        msg.date = moment(msg.date).format(n.dateFormat);
                                        // msg.date = moment(moment().calendar(msg.date)).format(n.dateFormat);
                                    }
                                }

                                if (n.hash) {
                                    msg.hash = crypto.createHash('md5').update(msg.payload).digest('hex');
                                }

                                msg.url = page.url
                                node.send(msg);

                            });
                        },
                        failure: function(page) {
                            ctr += 1
                            node.status({fill:"red",shape:"ring",text: ctr + " - Failed" });
                        },
                        finished: function(crawledUrls) {
                            node.status({fill:"green",shape:"dot",text: ctr + " - Finished" });
                        }
                });

            }

        });

        this.on("error", function() {
            node.status({});
        });

        this.on("close", function() {
            node.status({});
        });
    }

    RED.nodes.registerType("js-crawler", JsCrawlerNode);

}
