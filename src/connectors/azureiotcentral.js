"use strict";

const request = require('request');
const clientFromConnectionString = require('azure-iot-device-http').clientFromConnectionString;
const Message = require('azure-iot-device').Message;

var clients = {};

function send(device, payload) {

    if (!device || !device.connectionString || (device.connectionString.length < 10)) {
        console.log('Azureiotcentral Bad connectionString.');
        return;
    }

    let connectionString = device.connectionString;
    if (!(connectionString in clients)) {

        var client = clientFromConnectionString(device.connectionString);

        var connectCallback = function (err) {
            if (err) {
              console.error('Azureiotcentral Could not connect: ' + err.toString());
              delete clients[connectionString];

            } else {
              console.log('Azureiotcentral Client connected');
    
                client.sendEvent(new Message(JSON.stringify(payload)), function (err) {
                    if (err) {
                        console.log("Azureiotcentral", err.toString());
                    } else {
                        console.log("Azureiotcentral the message was delivered");
                    }
                });
            }
        };

        client.on('message', function (msg) { 
            console.log("client.on('message'", msg); 
            client.complete(msg, function () {
                console.log('completed');
            });
        }); 

        client.open(connectCallback)

        clients[connectionString] = client;
    
    } else {

        clients[connectionString].sendEvent(new Message(JSON.stringify(payload)), function (err) {
            if (err) {
                console.log("Azureiotcentral", err.toString());
            } else {
                console.log("Azureiotcentral the message was delivered");
            }
        });
    }
}

function getConnectionString(scopeId, deviceId, primaryKey) {
  return new Promise((resolve, reject) => {
      let options = {
          url: 'https://cooper.bigclown.cloud/quick/endpoint',
          headers: {
              'Content-Type': 'application/json'
          },
          json: { scopeId, deviceId, primaryKey },
          method: "POST"
      };

      request(options, function (error, response, payload) {
          if (error) {
              return reject(error);
          }
          if (!response || response.statusCode != 200) {
            return reject(payload);
          }
          console.log('Request: response', payload);
          resolve(payload);
      });
  });
}

module.exports = { send, getConnectionString }