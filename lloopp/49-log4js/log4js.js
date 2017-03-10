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
 * Author: Michael Angelo Ruta & Alexander Pimentel (2015)
 *
 **/

var log4js = require('log4js'); 
const exec = require('child_process').exec;

log4js.configure({
  	appenders: [],
	replaceConsole: false
});

log4js.loadAppender('file');

module.exports = function(RED) {
    "use strict";
    function log4jsNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        node.category = n.category;
        
		// var date = new Date().toISOString().slice(0, 10).replace('T', ' ');

		var logger;
		if(log4js.hasLogger(n.category)) {
			logger = log4js.getLogger(n.category);
		} else {
			log4js.addAppender(log4js.appenders.file('data/logs/'+n.category+".log"), n.category);
			logger = log4js.getLogger(n.category);
		}
		
        var safeJsonStringify = require('safe-json-stringify');

        RED.httpAdmin.get('/log4js/:category', function (req, res) {
        	var file = 'data/logs/'+req.params.category+".log"
			exec('tail -n 100 '+file, function (error, stdout, stderr){
			  if (error) {
			    res.json(error);
			    return;
			  }
		      res.writeHead(200, {'Content-Type': 'text/plain'});
			  res.end(""+stdout);
			});

		});

        this.on('input', function (msg) {
			
			var message = msg.payload || msg;

			if(!msg.verbose) {
				delete msg.headers
				delete msg.req
			}

			if(typeof message !== undefined){

	        	if(n.json == true) {
	        		msg.timestamp = Date.now()/1000|0;
	        		logger.info(safeJsonStringify(msg));
	        	} else {
		        	var level = msg.logger || n.level;

					if(!message instanceof String){
						message = safeJsonStringify(message);
					}

					if(level == "info"){
						logger.info(message);
					}else if(level == "warn"){
						logger.warn(message);
					}else if(level == "error"){
						logger.error(message);
					}else if(level == "fatal"){
						logger.fatal(message);
					}
	            }
        	}

        });

    }

    RED.nodes.registerType("log4js",log4jsNode);

}