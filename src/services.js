'use strict'

const { app, ipcMain, BrowserWindow } = require("electron");
const { getSerialPortList, STATE_DISCONNECTED, STATE_CONNECTION, STATE_CONNECTED} = require("./atclient");
const crypto = require('crypto');
const { Gateway } = require("./gateway");
const { Node } = require("./node");
const request = require('request');
const ConfigStore = require("./ConfigStore");

var settings = new ConfigStore("settings.json", {
    "language": "en",
    "ubidots_auth_token": "test"
});

var gateway = null;
var node = null;

function portListhandler() {
    getSerialPortList((ports)=>{

        allWindowsSend("port-list", ports);

        setTimeout(portListhandler, 2000);
    });
}

module.exports.init = function() {

    portListhandler();

    // ipcMain.on("port-list/get", (event, data) => {    
    // });

    function sendError(message) {
        allWindowsSend('error', message);
    }

    ipcMain.on("gateway/connect", (event, device) => {
        console.log("On gateway/connect", device);

        if (gateway) {
            if (device == gateway.getDevice()) {
                if (gateway.getState() == STATE_DISCONNECTED) {
                    gateway.connect();
                }
                return;
            }
        }
        gateway = new Gateway(device);
        gateway.on('state', (state) => {
            console.log("Gateway state:", state);
            allWindowsSend('gateway/state', state);
        });
        gateway.on('error', (message) => {
            console.log("Gateway error:", message);
            allWindowsSend('error', message);
        });

        gateway.on('update', (payload) => {
            console.log("Gateway update:", payload);
            allWindowsSend('gateway-update', payload);
        });

        gateway.on('recv', (payload) => {
            allWindowsSend('gateway/recv', payload);
        });

        gateway.on('recv', async (payload) => {
            let token = settings.get('ubidots_auth_token');
            if (!token || token.length < 8) {
                console.log('Bad ubidots_auth_token.');
                return;
            }

            let id = payload.id;

            delete payload.id;

            for (var propName in payload) { 
                if (payload[propName] === null || payload[propName] === undefined) {
                    delete payload[propName];
                }
            }

            let options = {
                url: 'https://industrial.api.ubidots.com/api/v1.6/devices/' + id + '/?type=cooper',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': token
                },
                json: payload,
                method: "POST"
              };

            console.log('Request options:', options);

            request(options, function (error, resp, body) {
                console.log('Request: response', body);
            });
        });

        gateway.connect();
    });

    ipcMain.on("gateway/disconnect", (event) => {
        console.log("On gateway/disconnect");
        gateway.disconnect();
    });

    ipcMain.on('gateway/state/get', (event) => {
        event.sender.send("gateway/state", gateway == null ? STATE_DISCONNECTED : gateway.getState() );
    });

    function sendGatewayNodeList(event){
        return gateway.getNodeList().then((list)=>{
            event.sender.send("gateway/node/list", list);
        });
    }

    ipcMain.on('gateway/node/list/get', (event) => {
        sendGatewayNodeList(event);
    });

    ipcMain.on('gateway/node/detach', (event, id) => {
        console.log("ON gateway/node/detach", id);
        gateway.nodeDetach(id)
            .then(()=>{
                sendGatewayNodeList(event);
            })
            .catch(sendError);
    });

    ipcMain.on('gateway/node/attach', (event) => {
        console.log("ON gateway/node/attach");
        if (!gateway || (gateway.getState() != STATE_CONNECTED)){
            return event.sender.send("error", "Dongle is not connected.");
        }
        if (!node || (node.getState() != STATE_CONNECTED)){
            return event.sender.send("error", "Node is not connected.");
        }

        let key = crypto.randomBytes(16).toString('hex').toLowerCase();
        
        console.log("Key " + key);

        node.setKey(key)
            .then(()=>{
                return node.setChannel(gateway.channel);
            })
            .then(()=>{
                return gateway.nodeAttach(node.id, key);
            })
            .then(()=>{
                return sendGatewayNodeList(event);
            })
            .then(()=>{
                return new Promise((resolve, reject)=>{
                    setTimeout(resolve, 1000);
                });
            })
            .then(()=>{
                return node.send();
            })
            .then(()=>{
                console.log('Done gateway/node/attach');
            })
            .catch(sendError);        
    });

    ipcMain.on("sync/settings/get", (event, key) => {
        let value = settings.get(key);
        console.log("settings/get", key, value);
        event.returnValue = value;
        //event.sender.send("settings/value/" + key , value);
    });

    ipcMain.on("sync/settings/getAll", (event, dummy) => {
        event.returnValue = settings.getAll();
        //event.sender.send("settings/all" , settings.getAll() )
    });

    ipcMain.on("sync/settings/set", (event, data) => {
        console.log("settings/set", data);
        settings.set(data.key, data.value);
        event.returnValue = true;
    });


    ipcMain.on("node/connect", (event, device) => {
        console.log("On node/connect", device);

        if (node) {
            if (node == node.getDevice()) {
                if (node.getState() == STATE_DISCONNECTED) {
                    node.connect();
                }
                return;
            }
        }
        node = new Node(device);
        node.on('state', (state) => {
            console.log("Node state:", state);
            event.sender.send('node-update', {state});
        });
        node.on('error', (message) => {
            console.log("Node error:", message);
            event.sender.send('error', message);
        });
        node.on('update', (payload) => {
            console.log("Node update:", payload);
            event.sender.send('node-update', payload);
        });

        node.connect();
    });

    ipcMain.on("node/disconnect", (event) => {
        console.log("on node:disconnect");
        node.disconnect();
    });

    ipcMain.on('node/state/get', (event) => {
        event.sender.send("node/state", node == null ? STATE_DISCONNECTED : node.getState() );
    });

};

function allWindowsSend(topic, data) {
    BrowserWindow.getAllWindows().forEach((view) => {
      try {
        view.webContents.send(topic, data);
      }
      catch (error) {
          console.error("notifyAll", error)
      }
    });
}