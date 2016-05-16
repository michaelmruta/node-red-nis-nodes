/**
 * Copyright 2015 Michael Angelo Ruta, Atsushi Kojo.
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
 **/

module.exports = function (RED) {
  'use strict';
  var Client = require('ftp');
  var fs = require('fs');
  var path = require('path');

  function FtpNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    var credentials = RED.nodes.getCredentials(n.id);
    this.options = {
      'host': n.host || 'localhost',
      'port': n.port || 21,
      'secure': n.secure || false,
      'secureOptions': n.secureOptions,
      'user': n.user || 'anonymous',
      'password': credentials.password || 'anonymous@',
      'connTimeout': n.connTimeout || 10000,
      'pasvTimeout': n.pasvTimeout || 10000,
      'keepalive': n.keepalive || 10000
    };
  }

  RED.nodes.registerType('ftp', FtpNode, {
    credentials: {
      password: { type: 'password' }
    }
  });

  function FtpInNode(n) {
    RED.nodes.createNode(this, n);
    this.ftp = n.ftp;
    this.operation = n.operation;
    this.filename = n.filename;
    this.ftpConfig = RED.nodes.getNode(this.ftp);

    var error = function(e) { node.error(e); return;}

    if (this.ftpConfig) {
      var node = this;
      var options = node.ftpConfig.options
      node.on('input', function (msg) {

        var filename = node.filename || msg.filename;
        var localFilename = (msg.localFilename)
                           ? n.storage + path.basename(msg.localFilename)
                           : n.storage + path.basename(msg.filename);

        var c = new Client();
        
        c.on('ready', function() {
          node.status({});

          if (node.operation == 'list') {
            var cb = function(err, list) {
              if (err) node.error(err);
              c.end();
              msg.payload = list;
              node.send(msg);
            };
            if(msg.directory) {
              node.status({fill:"green",shape:"dot",text:"LIST: "+msg.directory});
              c.list(msg.directory,cb);
            } else {
              node.status({fill:"green",shape:"dot",text:"LIST: ~"});
              c.list(cb);
            }
          } else if (node.operation == 'get') {
            
            if(!filename) {
              node.error("FTP get request is rejected because msg.filename is not set...");
              return
            }

            c.get(filename, function(err, stream) {
                if (err) node.error(err);
                if(stream) {
                  stream.once('close', function() { c.end(); });
                  stream.on('error',error)
                  var fstream = fs.createWriteStream(localFilename);
                  fstream.on('error',error)
                  stream.pipe(fstream);
                  node.status({fill:"green",shape:"dot",text:"GET: "+path.basename(filename)});
                  msg.payload = "GET: "+options.user+"@"+options.host+":"+filename+" -> "+localFilename;
                  node.send(msg);
                } else {
                  msg.error = err;
                  node.send(msg)
                }
            });
          } else if (node.operation == 'put') {

              if(!filename){
                node.error("FTP put request is rejected because msg.filename is not set...");
                return
              }

              c.put(localFilename, filename, function(err) {
                  if (err) node.error(err);
                  c.end();
                  node.status({fill:"green",shape:"dot",text:"PUT: "+path.basename(localFilename)});
                  msg.payload = "PUT: "+localFilename+" -> "+options.user+"@"+options.host+":"+filename;
                  node.send(msg);
              });
          } else if (node.operation == 'delete') {
            msg.payload = "FTP delete request is not allowed...";
            node.send(msg);
          }
        });

        c.on('error', function (e) {
          node.error(e)
        });
        c.connect(options);
      });
    } else {
      this.error('missing ftp configuration');
    }
  }
  RED.nodes.registerType('ftp in', FtpInNode);
}
