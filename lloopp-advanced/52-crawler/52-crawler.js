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

var Crawler = require("simplecrawler");
var cheerio = require('cheerio');
var moment = require('moment');
var fs = require('fs');
var crypto = require('crypto');

module.exports = function(RED) {
    "use strict";

    function CrawlerNode(n) {
        RED.nodes.createNode(this, n);

        var node = this;

        node.status({});

        var crawler = {}

        this.on('input', function(msg) {
            
            if(msg.topic == "") {
                node.status({});
                if(crawler.queue) {
                    crawler.queue.freeze("crawler-queue.json", function () {
                        process.exit();
                    });

                    crawler.queue.defrost("crawler-queue.json");
                }
            } else {

                crawler = new Crawler(msg.topic);

                var config = msg.config || {} 
                
                crawler.filterByDomain = config.filterByDomain || n.filterByDomain || true;
                crawler.interval = config.interval || n.interval || 15;
                crawler.maxConcurrency = config.maxConcurrency || n.maxConcurrency || 5;
                crawler.maxDepth = config.maxDepth || n.maxDepth || 1;
                crawler.userAgent = config.userAgent || n.userAgent || "Chrome";
                
                if( config.supportedMimeTypes ) {
                    crawler.supportedMimeTypes = config.supportedMimeTypes;
                    crawler.downloadUnsupported = false;
                } else if(n.supportedMimeTypes) {
                    var regexes = n.supportedMimeTypes.split("\,");
                    crawler.supportedMimeTypes = [] 
                    for(var i in regexes) {
                       crawler.supportedMimeTypes.push(new RegExp(regexes[i]))
                    }
                    crawler.downloadUnsupported = false;
                }

                for (var config_ in config) {
                    crawler[config_] = config[config_]
                }

                var ctr = 0, found = 0;
                node.status({fill:"blue",shape:"dot",text: "Starting..." });

                crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {

                        console.log(queueItem.id + ": " + queueItem.depth +  " - " + queueItem.url)

                        ctr += 1

                        msg.queueItem = queueItem

                        node.status({fill:"blue",shape:"dot",text: "Matches: " + found + ", Crawled: " + ctr});

                        msg.itemNo = ctr;

                        var $ = cheerio.load(responseBuffer.toString())

                        if(!n.queryForItemField) {
                            msg.payload = responseBuffer.toString()
                            node.send(msg);
                        } else {
                            $(n.queryForItemField).each(function(i, elem) {

                                found += 1

                                var post = cheerio.load($(this).html())

                                if(n.queryForRemovedFields) {
                                    post(n.queryForRemovedFields).remove()
                                }
                                if(n.queryForDateField) {
                                    msg.date = post(n.queryForDateField).text()
                                }
                                if(n.queryForContentField) {
                                    msg.payload = post(n.queryForContentField).text()
                                } else {
                                    msg.payload = $(this).html();
                                }

                                if (n.removeWhiteSpaces) {
                                    msg.payload = msg.payload.replace(/<\/?[^>]+(>|$)/g, " ")
                                        .replace(/\t/g, "")
                                        .replace(/\n/g, "")
                                        .replace(/\r/g, " ")
                                        .replace("     ", " ")
                                        .replace(/undefined/, "")
                                        .trim();
                                }

                                if (n.queryForDateField) {
                                    if (n.sDateFormat && n.tDateFormat) {
                                        msg.date = moment(msg.date,n.sDateFormat).format(n.tDateFormat);
                                    } else if (n.tDateFormat) {
                                        msg.date = moment(msg.date).format(n.tDateFormat);
                                    }
                                }

                                if (n.hash) {
                                    msg.hash = crypto.createHash('md5').update(msg.payload).digest('hex');
                                }
                                node.send(msg);
                            });
                        }
                })
                .on("queueerror", function(error, URLData) {
                    throw error
                })
                .on("complete", function() {
                    node.status({fill:"green",shape:"dot",text: ctr + " - Finished" });
                })

                crawler.start();
            }

        });

        this.on("error", function() {
            node.status({});
        });

        this.on("close", function() {
            node.status({});
            if(crawler.crawl) {
                crawler.queue.freeze("crawler-queue.json", function () {
                    // process.exit();
                });
                crawler.queue.defrost("crawler-queue.json");
            }
        });
    }

    RED.nodes.registerType("crawler", CrawlerNode);

}
