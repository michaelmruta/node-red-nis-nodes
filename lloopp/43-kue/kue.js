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

var kue = require('kue');
var Redis = require('ioredis');

var net = require('net');
var server;

module.exports = function(RED) {
   "use strict";

    function KueNode(n) {

        RED.nodes.createNode(this,n);
        var node = this;
        this.set = n.set;

        var redis;

        if(n.port || n.host)
            redis = new Redis(n.port || 6379 , n.host || 'localhost');
        else 
            redis = new Redis('/tmp/redis.sock')

        var queue = {};
        var clock = null;

        redis.on("ready", function () {

            if(!server) {
                server = net.createServer();

                server.once('error', function(err) {
                  if (err.code === 'EADDRINUSE') {
                    // port is currently in use
                  }
                });

                server.once('listening', function() {
                    server.close();
                    var app = require('express')();

                    app.use(kue.app);

                    app.listen(8888);
                });
                server.listen(8888);
            }

            queue = kue.createQueue({
                enableOfflineQueue: false,
                createClientFactory: function(){
                    return redis;
                }
            });

            queue.on( 'error', function( err ) {
                node.log( err );
            });

            clock = setInterval(function() {
                queue.inactiveCount( function( err, total ) {
                    count.inactiveCount = total
                });
                // queue.activeCount( function( err, total ) {
                //     count.activeCount = total
                // });
                queue.completeCount( function( err, total ) {
                    count.completeCount = total
                });
                // queue.failedCount( function( err, total ) {
                //     count.failedCount = total
                // });
                // queue.delayedCount( function( err, total ) {
                //     count.delayedCount = total
                // });
                node.status({fill:"blue",shape:"dot",text:(count.inactiveCount||0)+" / "+(count.completeCount||0) });
            }, 2000);

            node.log("Redis for kue is now ready...");
        });

        redis.on( 'error', function( err ) {
            node.log( err );
            redis.end()
        });

        var count = {}

        var stopClock = function() {
            clearInterval(clock);
            clock = null;
        }

        RED.httpAdmin.post("/kue/:id", function(req,res) {
            var node = RED.nodes.getNode(req.params.id);
            queue.process(n.set, n.concurrency, function(job, done){
                node.send([null, job]);
                done();
            });
            res.send("OK");
        });

        this.on('input', function (msg) {
    
            if(msg.topic == "process"){
                queue.process(n.set, n.concurrency, function(job, done){
                    try {
                        node.send([null, job]);
                        done();
                    } catch(e) {
                        node.error(e);
                    }
                });
            }
  
            if(msg.topic == "pause"){
                queue.process(n.set, function(job, ctx, done){
                  ctx.pause( 5000, function(err){
                    node.error(err);
                  });
                });
            }

            if(msg.topic == "resume"){
                queue.process(n.set, function(job, ctx, done){
                    ctx.resume();
                });
            }

            if(msg.topic == "create"){
                if(msg.payload.constructor === Object) {

                    var job = queue.create(n.set, msg.payload).save( function(err){
                       if( err ) 
                        node.error(err);
                       else
                        node.send([job.data, null]);
                    });

                    if(msg.payload.delay) {
                        job.delay(parseInt(msg.payload.delay) || 0)
                    }
                }
            }

        });

        this.on("error", function() {
            stopClock();
        });

        this.on("close", function() {
            stopClock();
        });

        process.once( 'SIGTERM', function ( sig ) {
          queue.shutdown( 5000, function(err) {
            node.log( 'Kue shutdown: ', err||'' );
            process.exit( 0 );
          });
        });

    }

    RED.nodes.registerType("kue",KueNode);

}
