"use strict";

const EventEmitter = require('events');
const { ATClient, port_list, STATE_DISCONNECTED, STATE_CONNECTION, STATE_CONNECTED } = require("./atclient");

const RECV_DECODE = [
    ["rssi", parseInt],
    ["id", null],
    ["sequence", parseInt],
    ["altitude", parseInt],
    ["co2-conc", parseInt],
    ["humidity", parseFloat],
    ["illuminance", parseInt],
    ["motion-count", parseInt],
    ["orientation", parseInt],
    ["press-count", parseInt],
    ["pressure", parseInt],
    ["sound-level", parseInt],
    ["temperature", parseFloat],
    ["voc-conc", parseInt],
    ["voltage", parseFloat]
];

class Gateway extends EventEmitter {
    constructor(device) {
        super();

        this._state = STATE_DISCONNECTED;
        this._at = new ATClient(device);
        this._at.on('state', this._at_state_change.bind(this));
        this._at.on('urc', this._at_urc.bind(this));
    }

    connect() {
        return this._at.connect();
    }

    disconnect() {
        return this._at.disconnect();
    }

    getDevice() {
        return this._at.getDevice();
    }

    getState() {
        return this._state;
    }

    command(command, callback, timeout=1000) {
        this._at.command(command, callback, timeout);
    }
    
    _at_state_change(state) {
        if (state == STATE_CONNECTION) {
            this._state = STATE_CONNECTION;
        }
        else if (state == STATE_CONNECTED) {
            this._state = STATE_CONNECTED;
        }
        else if (state == STATE_DISCONNECTED) {
            this._state = STATE_DISCONNECTED;
        }
        this.emit("state", this._state);
    }

    _at_urc(line) {
        console.log("Gateway urc:", line);

        if (line.startsWith('$RECV:')) {
            return this._decode_recv(line);
        }
    }

    _decode_recv(line) {
        let values = line.slice(7).split(',');
        let payload = {};
        for (let i=0, l=RECV_DECODE.length; i < l; i++) {
            let decode = RECV_DECODE[i];
            let value = values[i];
            if (value != "") {
                payload[decode[0]] = decode[1] ? decode[1](value) : value;
            } else {
                payload[decode[0]] = null;
            }
        }
        this.emit('recv', payload);
    }
}

module.exports = { Gateway, port_list, STATE_DISCONNECTED, STATE_CONNECTION, STATE_CONNECTED }
