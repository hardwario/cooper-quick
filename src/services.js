'use strict'

const { app, ipcMain, BrowserWindow } = require("electron");
const { Gateway, port_list, STATE_DISCONNECTED, STATE_CONNECTION, STATE_CONNECTED} = require("./gateway");
const request = require('request');
const ConfigStore = require("./ConfigStore");

var settings = new ConfigStore("settings.json", {
    "language": "en",
    "ubidots_auth_token": "test"
});

var gateway = null;

module.exports.init = function() {

    ipcMain.on("port-list/get", (event, data) => {
        port_list((ports)=>{
            event.sender.send("port-list", ports);
        });
    });

    ipcMain.on("gateway/connect", (event, device) => {
        console.log("on gateway:connect", device);

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
        gateway.on('error', (state) => {console.log("Gateway error:", state);});

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
        console.log("on gateway:disconnect");
        gateway.disconnect();
    });

    ipcMain.on('gateway/state/get', (event) => {
        event.sender.send("gateway/state", gateway == null ? STATE_DISCONNECTED : gateway.getState() );
    });

    ipcMain.on('node/list/get', (event) => {
        gateway.command('$LIST', (cmd, rows) => {
            
            event.sender.send("node/list", rows.map((row)=>{
                let split = row.split(',');
                return {"id": split[0], "alias": split[1].slice(1, split[1].length - 2), recv: {}}
            }));
        });
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