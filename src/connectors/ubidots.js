"use strict";

const request = require('request');

function send(token, payload) {

    if (!token || token.length < 8) {
        console.log('Ubidots Bad ubidots_auth_token.');
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

    // console.log('Request options:', options);

    request(options, function (error, resp, body) {
        console.log('Ubidots response:', body);
    });
}

module.exports = { send }