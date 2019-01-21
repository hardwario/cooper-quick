'use strict'

const { app, ipcMain, BrowserWindow } = require("electron");
const { getSerialPortList, STATE_DISCONNECTED, STATE_CONNECTION, STATE_CONNECTED} = require("./atclient");
const crypto = require('crypto');
const { Gateway } = require("./gateway");
const { Node } = require("./node");
const ConfigStore = require("./ConfigStore");
const ubidots = require('./connectors/ubidots');
const azureiotcentral = require('./connectors/azureiotcentral');

var settings = new ConfigStore("settings.json", {
    "app": {
        "language": "en",
    },
    "dongle": {
        "serialNumber": null
    },
    "ubidots": {
        "enable": false,
        "auth_token": ""
    },
    "azureiotcentral": {
        "enable": false,
        "devices": {}
    }
});

var gateway = null;
var node = null;
var portListTimer = null;

function portListhandler() {
    getSerialPortList((ports)=>{

        allWindowsSend("port-list", ports);

        portListTimer = setTimeout(portListhandler, 2000);

        if (gateway === null) {
            let serialNumber = settings.get('dongle', 'serialNumber');

            for (let i=0, l=ports.length; i < l; i++) {
                if (ports[i].serialNumber == serialNumber) {
                    let device = {comName: ports[i].comName, serialNumber: ports[i].serialNumber };
                    gatewayConnect(device);
                    allWindowsSend('gateway-update', {device: device});
                }
            }
        }
    });
}

function gatewayConnect(device) {
    if (gateway) {
        if (device.comName == gateway.getDevice()) {
            if (gateway.getState() == STATE_DISCONNECTED) {
                gateway.connect();
            }
            return;
        }
    }
    gateway = new Gateway(device.comName);
    gateway.on('state', (state) => {
        console.log("Gateway state:", state);
        if (state == STATE_CONNECTED) {
            settings.set('dongle', 'serialNumber', device.serialNumber);
        }
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

        if (!settings.get('ubidots', 'enable')) {
            return;
        }

        let token = settings.get('ubidots', 'auth_token');

        ubidots.send(token, payload);
    });

    gateway.on('recv', async (payload) => {

        if (!settings.get('azureiotcentral', 'enable')) {
            return;
        }

        let devices = settings.get('azureiotcentral', 'devices');

        azureiotcentral.send(devices[payload.id], payload);
    });

    gateway.connect();
}

module.exports.init = function() {
    function sendError(message) {
        allWindowsSend('error', message);
    }

    ipcMain.on("app/mounted", (event)=>{
        if (!portListTimer) portListhandler();
    });

    ipcMain.on("gateway/connect", (event, device) => {
        console.log("On gateway/connect", device);
        gatewayConnect(device);
    });

    ipcMain.on("gateway/disconnect", (event) => {
        console.log("On gateway/disconnect");
        settings.set('dongle', 'serialNumber', null);
        if (!gateway) return;
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
                event.sender.send("success", "The device was successfully detached from Dongle.");
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
                event.sender.send("success", "The device was successfully attached to Dongle.");
            })
            .catch(sendError);        
    });

    ipcMain.on("sync/settings/get", (event, payload) => {
        let value = settings.get(payload.section, payload.key);
        console.log("settings/get", payload.section, payload.key, value);
        event.returnValue = value;
        //event.sender.send("settings/value/" + key , value);
    });

    ipcMain.on("sync/settings/getAll", (event, dummy) => {
        event.returnValue = settings.getAll();
        //event.sender.send("settings/all" , settings.getAll() )
    });

    ipcMain.on("sync/settings/set", (event, payload) => {
        console.log("settings/set", payload);
        settings.set(payload.section, payload.key, payload.value);
        event.returnValue = true;
    });

    ipcMain.on('azureiotcentral/connectionString/get', (event, payload) => {
        console.log('azureiotcentral/connectionString/get', payload);
        azureiotcentral.getConnectionString(payload.scopeId, payload.deviceId, payload.primaryKey)
        .then((connectionString)=>{
            event.sender.send('azureiotcentral/connectionString', {deviceId: payload.deviceId, connectionString});
        }).catch((error)=>{
            sendError(error);
            event.sender.send('azureiotcentral/connectionString', {deviceId: payload.deviceId});
        });
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