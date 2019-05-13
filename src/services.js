'use strict'

const { app, ipcMain, BrowserWindow } = require("electron");
const { getSerialPortList, STATE_DISCONNECTED, STATE_CONNECTION, STATE_CONNECTED} = require("./atclient");
const crypto = require('crypto');
const { Gateway } = require("./gateway");
const { Sensor } = require("./sensor");
const ConfigStore = require("./ConfigStore");
const ubidots = require('./connectors/ubidots');
const azureiotcentral = require('./connectors/azureiotcentral');

var settings = new ConfigStore("settings.json", {
    "app": {
        "language": "en",
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
var sensor = null;

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
    });

    ipcMain.on("gateway/disconnect", (event) => {
        console.log("On gateway/disconnect");
        gateway.disconnect();
    });

    ipcMain.on('gateway/state/get', (event) => {
        event.sender.send("gateway/state", gateway == null ? STATE_DISCONNECTED : gateway.getState() );
    });

    function sendGatewaySensorList(event){
        return gateway.getSensorList().then((list)=>{
            event.sender.send("gateway/sensor/list", list);
        });
    }

    ipcMain.on('gateway/sensor/list/get', (event) => {
        sendGatewaySensorList(event);
    });

    ipcMain.on('gateway/sensor/detach', (event, id) => {
        console.log("ON gateway/sensor/detach", id);
        gateway.sensorDetach(id)
            .then(()=>{
                sendGatewaySensorList(event);
            })
            .catch(sendError);
    });

    ipcMain.on('gateway/sensor/attach', (event) => {
        console.log("ON gateway/sensor/attach");
        if (!gateway || (gateway.getState() != STATE_CONNECTED)){
            return event.sender.send("error", "Dongle is not connected.");
        }
        if (!sensor || (sensor.getState() != STATE_CONNECTED)){
            return event.sender.send("error", "Sensor is not connected.");
        }

        let key = crypto.randomBytes(16).toString('hex').toLowerCase();
        
        console.log("Key " + key);

        sensor.setKey(key)
            .then(()=>{
                return sensor.setChannel(gateway.channel);
            })
            .then(()=>{
                return gateway.sensorAttach(sensor.id, key);
            })
            .then(()=>{
                return sendGatewaySensorList(event);
            })
            .then(()=>{
                return new Promise((resolve, reject)=>{
                    setTimeout(resolve, 1000);
                });
            })
            .then(()=>{
                return sensor.send();
            })
            .then(()=>{
                console.log('Done gateway/sensor/attach');
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

    ipcMain.on("sensor/connect", (event, device) => {
        console.log("On sensor/connect", device);

        if (sensor) {
            if (sensor == sensor.getDevice()) {
                if (sensor.getState() == STATE_DISCONNECTED) {
                    sensor.connect();
                }
                return;
            }
        }
        sensor = new Sensor(device);
        sensor.on('state', (state) => {
            console.log("Sensor state:", state);
            event.sender.send('sensor-update', {state});
        });
        sensor.on('error', (message) => {
            console.log("Sensor error:", message);
            event.sender.send('error', message);
        });
        sensor.on('update', (payload) => {
            console.log("Sensor update:", payload);
            event.sender.send('sensor-update', payload);
        });

        sensor.connect();
    });

    ipcMain.on("sensor/disconnect", (event) => {
        console.log("on sensor:disconnect");
        sensor.disconnect();
    });

    ipcMain.on('sensor/state/get', (event) => {
        event.sender.send("sensor/state", sensor == null ? STATE_DISCONNECTED : sensor.getState() );
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