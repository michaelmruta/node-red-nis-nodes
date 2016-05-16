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

    function RScriptNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;
        var R = {}

        if(n.enabled) {

        	node.log('Initializing R-Script node: '+this.id)

			var fs = require('fs');
			var path = require("path");
	        var rio = require("rio");
			var spawn = require('child_process').spawn;
			var exec = require('child_process').exec;

			var file = path.join("data/", n.rscript)

	        this.on('input', function (msg) {

				if(msg.topic=='start') {
					node.log('Starting R script: '+file)
					fs.stat(n.executable, function(err, stat) {
					    if(err == null) {
					    	if(n.exec) {
			    		       R[node.id] = exec('R -f ' + file + ' --no-save', 
			    		        	function (error, stdout, stderr) {
			    					    node.log('stdout: ' + stdout);
			    			       });

					        } else {
					        	R[node.id] = spawn('R', ['-f',file,'--gui-none','--no-save']);
					        	R[node.id].on('error', function (err) {
					        	  	node.log('Error on ' + file + " : " + code);
					        	});
					        	R[node.id].on('close', function (code) {
					        	  	node.log('R process exited with code ' + code);
					        	});
							}
					    } else if(err.code == 'ENOENT') {
					        node.error(n.executable + ' was not found.')
					    } else {
					    	node.error(err);
					    }
					});
				} else if(msg.topic=='stop') {
					node.log('Stopping R script: '+n.rscript)
					if(rio) {
						rio.shutdown();
					}
					if(R[node.id]) {
						R[node.id].kill('SIGKILL');
					}
				} else {
		        	// buffered input using RServe
					// rio.bufferAndEval(null, {
					//     entryPoint: n.entry,
					//     data: msg.payload,
					//     callback: function(err, res) {
					//     	if(!err) {
					//     		msg.result = res;
					//     		node.send(msg)
					//     	} else {
					//     		node.error(err)
					//     	}
					//     }
					// });

		        	// source and eval
					rio.e({
						// command: msg.payload,
						// filename: msg.filename,
					    entrypoint: n.entry,
					    data: msg.payload,
					    callback: function(err, res) {
					    	if(!err) {
					    		msg.result = res;
					    		node.send(msg)
					    	} else {
					    		node.error(err)
					    	}
					    }
					});
				}

			});

	        this.on('close', function () {
	        	node.log('Shutting down R script: '+n.rscript)
				if(rio) {
					rio.shutdown();
				}
				if(R[node.id]) {
					R[node.id].kill('SIGKILL');
				}
			});
		} else {
        	node.log('Shutting down R script: '+n.rscript)
			if(rio) {
				rio.shutdown();
			}
			if(R[node.id]) {
				R[node.id].kill('SIGKILL');
			}
		}
    }

    RED.nodes.registerType("R script",RScriptNode);
}
