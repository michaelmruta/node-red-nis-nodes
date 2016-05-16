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

var log;
var redNodes;
var settings;

var fs = require("fs");
var _ = require("underscore");

var deniedMessageFlow = [
                          {
                            "type": "tab",
                            "id": "a0000001.000001",
                            "label": "Access Denied"
                          },
                          {
                            "id": null,
                            "type": "comment",
                            "name": "You are not AUTHORISED to view this workspace...",
                            "x": 200,
                            "y": 30,
                            "z": "a0000001.000001",
                            "wires": []
                          }
                        ];

module.exports = function(RED) {
    "use strict";

    settings = RED.settings;
    redNodes = RED.nodes;
    log = RED.log;

    RED.httpAdmin.get("/permission/user", function(req,res) {
        res.setHeader('Content-Type', 'application/json');
        if(req.user) {
            var u = {}
            u.username = req.user.username
            u.name = req.user.name
            u.role = req.user.role
            u.permission = req.user.permission
            u.email = req.user.email
            res.send(JSON.stringify( u ));
        } else {
            res.json({
                      "username": "guest",
                      "name": "Guest",
                      "role": "Guest",
                      "email": "guest@lloopp.net"
                    });
        }
    });

    // RED.httpAdmin._router.stack.forEach(function(r,i){
    //   if (r.route && r.route.path){
    //     if(r.route.path == '/flows') {
    //         // delete RED.httpAdmin._router.stack[i]
    //     }
    //   }
    // })

    RED.httpAdmin.get("/flows", function(req,res) {
        log.audit({event: "flows.get"},req);
        var activeFlows = redNodes.getFlows();

        var oldPermissionNodes = _.filter(activeFlows, function(m) { return m.type == "permission" } );

        if(req.isAuthenticated()) {

            var canRead = false;
            _.each(oldPermissionNodes, function(permissionNode) {
                var canWrite, hasUser, hasRole, isPermitted = true
                    var oPN = permissionNode;
                    hasUser = _.contains(oPN.users.split(","),req.user.username);
                    hasRole = _.contains(oPN.roles.split(","),req.user.role);
                    canReadOrWrite = oPN.access == "r" || oPN.access == "rw"
                    isPermitted = (canReadOrWrite && (hasRole || hasUser)) || req.user.role == "Root";
                if( isPermitted ){
                    canRead = true;
                }
            });

            if( canRead || oldPermissionNodes.length == 0 ){
                res.json(activeFlows);
            } else {
                res.json(200, deniedMessageFlow);
            }
        } else {
                res.json(200, deniedMessageFlow);
        }
    });

    RED.httpAdmin.post("/flows", function(req,res) {
        var reason = "";

        if(req.isAuthenticated()) {

            var flows = req.body;
            var activeFlows = redNodes.getFlows();

            // workspace deployment permission cheking
            var newPermissionNodes = _.filter(flows, function(m) { return m.type == "permission" } );
            var oldPermissionNodes = _.filter(activeFlows, function(m) { return m.type == "permission" } );

            var denied = false;
            _.each(oldPermissionNodes, function(permissionNode) {

                var z = permissionNode.z

                var newNodesOnSheet = _.filter(flows, function(m) { return m.z == z } );
                var activiteNodesOnSheet = _.filter(activeFlows, function(m) { return m.z == z } );

                newNodesOnSheet = _.map(newNodesOnSheet, function(o) { return _.omit(o, 'credentials'); });

                var isEqual = _.isEqual(newNodesOnSheet,activiteNodesOnSheet);

                var canWrite, hasUser, hasRole, isPermitted = true
                var oPN = permissionNode;
                    hasUser = _.contains(oPN.users.split(","),req.user.username);
                    hasRole = _.contains(oPN.roles.split(","),req.user.role);
                    canWrite = oPN.access == "rw"
                    isPermitted = (canWrite && (hasRole || hasUser)) || req.user.role == "Root";

                if( isEqual == false) {

                    var elem = _.findWhere(flows, {id:permissionNode.id});
                    var activeElem = _.findWhere(activeFlows, {id:permissionNode.id});

                    var originalVersion = elem ? elem.revision : 1;

                    if( elem ) {
                        elem.revision = parseInt( activeElem ? activeElem.revision : 0 ) + 1;
                        elem.last_modified = req.user.username;
                    }
                    if( activeElem && activeElem.last_modified != req.user.username && activeElem.revision > originalVersion ) {
                        denied = true; 
                        reason = "Can't deploy, somebody else have modified the current sheet while you are working on it.";
                    }
                    if(!isPermitted ){
                        denied = true;
                        reason = "Can't deploy, you're not authorised to perform that action.";
                    }

                }
                
            });


            if( !denied ) {
                var deploymentType = req.get("Node-RED-Deployment-Type")||"full";
                log.audit({event: "flows.set",type:deploymentType},req);

                if (deploymentType === 'reload') {
                    redNodes.loadFlows().then(function() {
                        res.status(204).end();
                    }).otherwise(function(err) {
                        log.warn(log._("api.flows.error-reload",{message:err.message}));
                        log.warn(err.stack);
                        res.status(500).json({error:"unexpected_error", message:err.message});
                    });
                } else {
                    redNodes.setFlows(flows,deploymentType).then(function() {
                        res.status(204).end();
                    }).otherwise(function(err) {
                        log.warn(log._("api.flows.error-save",{message:err.message}));
                        log.warn(err.stack);
                        res.status(500).json({error:"unexpected_error", message:err.message});
                    });
                }
            } else {
                res.json(550, reason);
            };

        } else {
          reason = "Can't deploy, login session has expired."
          res.json(550, reason);
        }
    });

    function PermissionNode(n) {
        RED.nodes.createNode(this,n);
    }
    RED.nodes.registerType("permission",PermissionNode);
}
