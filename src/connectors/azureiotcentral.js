"use strict";

const request = require('request');
const clientFromConnectionString = require('azure-iot-device-http').clientFromConnectionString;
const Message = require('azure-iot-device').Message;

var clients = {};

function send(device, payload) {

    console.log(device);

    if (!device || !device.connectionString || (device.connectionString.length < 10)) {
        console.log('Bad connectionString.');
        return;
    }

    let connectionString = device.connectionString;
    if (!(connectionString in clients)) {

        var client = clientFromConnectionString(device.connectionString);

        var connectCallback = function (err) {
            if (err) {
              console.error('Could not connect: ' + err);
              delete clients[connectionString];

            } else {
              console.log('Client connected');
    
                client.sendEvent(new Message(JSON.stringify(payload)), function (err) {
                    if (err) {
                        console.log(err.toString());
                    } else {
                        console.log("client.sendEvent callback no error");
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
                console.log(err.toString());
            } else {
                console.log("client.sendEvent callback no error");
            }
        });
    }
}

function getConnectionString(scopeId, deviceId, primaryKey) {
  return new Promise((resolve, reject) => {
      let options = {
          url: 'https://cooper.hardwario.cloud/quick/endpoint',
          headers: {
              'Content-Type': 'application/json'
          },
          json: { scopeId, deviceId, primaryKey },
          method: "POST"
      };

      request(options, function (error, resp, payload) {
          if (error) {
              return reject(error);
          }
          console.log('Request: response', payload);
          resolve(payload);
      });
  });
}


module.exports = { send, getConnectionString }

