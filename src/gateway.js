"use strict";

const EventEmitter = require('events');
const { ATClient, getSerialPortList, STATE_DISCONNECTED, STATE_CONNECTION, STATE_CONNECTED } = require("./atclient");


function str(x) {
    return x + '';
}

const RECV_DECODE_V100 = [
    ["rssi", parseInt],
    ["id", str],
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

const RECV_START = [
    ["rssi", parseInt],
    ["id", str],
    ["header", parseInt],
    ["sequence", parseInt],
    ["uptime", parseInt],
]

const RECV_TYPE_LUT = {
    1: {'type': 'beacon',
        'items': [
            ["altitude", parseInt],
            ["co2_conc", parseInt],
            ["humidity", parseFloat],
            ["illuminance", parseInt],
            ["motion_count", parseInt],
            ["orientation", parseInt],
            ["press_count", parseInt],
            ["pressure", parseInt],
            ["sound_level", parseInt],
            ["temperature", parseFloat],
            ["voc_conc", parseInt],
            ["voltage", parseFloat]
        ]},
    2: {'type': 'sound',
        'items': [
            ["min", parseInt],
            ["max", parseInt],
        ]}
}

class Gateway extends EventEmitter {
    constructor(device) {
        super();

        this._oldRecv = false;
        this._state = STATE_DISCONNECTED;
        this._at = new ATClient(device);
        this._at.on('state', this._atStateChange.bind(this));
        this._at.on('urc', this._atURC.bind(this));
        this._at.on('error', (msg)=>{
            this.emit('error', msg)
        });
        
        this.sensorDetach = this.sensorDetach.bind(this);
        this.sensorAttach = this.sensorAttach.bind(this);
        this.setChannel = this.setChannel.bind(this);
        this._storeConfig = this._storeConfig.bind(this);
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

    getSensorList() {
        return new Promise((resolve, reject)=>{
            this._at.command('$LIST', (cmd, rows) => { 
                if (rows === null) {
                    return reject("Error reading Sensor list.");
                }else {
                    resolve( rows.map((row)=>{
                            let split = row.split(',');
                            return {"id": split[0], "alias": split[1].slice(1, split[1].length - 2), recv: {}}
                        })
                    );
                }
            });
        });
    }

    sensorDetach(id){
        return new Promise((resolve, reject)=>{
            this._at.commandp('$DETACH=' + id)
                .then(this._storeConfig)
                .then(resolve)
                .catch(reject);
        });
    }

    sensorAttach(id, key){
        return new Promise((resolve, reject)=>{
            if (key.length != 32){
                return reject("Key has bad length");
            }
            this._at.commandp('$ATTACH=' + id + ',' + key)
                .then(this._storeConfig)
                .then(resolve)
                .catch(reject);
        });
    }

    setChannel(channel){
        return new Promise((resolve, reject)=>{
            channel = parseInt(channel);
            if (channel < 0 || channel > 19){
                return reject("Wrong channel.");
            }
            this._at.commandp('$CHANNEL=' + channel)
                .then(this._storeConfig)
                .then(resolve)
                .catch(reject);
        });
    }

    _storeConfig(){
        return this._at.commandp('&W');
    }

    _update(command, response) {
        if (response === null) {
            this.emit('errot', "Error read " + command);
            return;
        }

        let i = response[0].indexOf(':');
        let value = response[0].slice(i+2);

        if (command == "+CGMM") {
            this.model = value;
            this.emit('update', {model: value});
        }
        else if (command == "+CGMR") {
            this.firmwareVersion = value;
            this.emit('update', {firmwareVersion: value});
        }
        else if (command == "+CGSN") {
            this.id = value;
            this.emit('update', {id: value});
        }
        else if (command == "$CHANNEL?") {
            value = parseInt(value);
            this.channel = value;
            this.emit('update', {channel: value});
        }
    }
    
    _atStateChange(state) {
        if (state == STATE_CONNECTED) {
            
            this._at.command("I", (command, response)=>{
                if (response) {

                    if (/COOPER RF Dongle R\d+\.\d+ v.+?/.test(response[0]))
                    {
                        this._oldRecv = false;
                    } else if (response[0].indexOf("DONGLE") > -1) {
                        this._oldRecv = true;
                    } else {
                        this.emit("error", "This device is not COOPER RF Dongle.");
                        this._at.disconnect();
                        return
                    }
                    
                    this._state = STATE_CONNECTED;
                    this.emit("state", this._state);

                    this._update(command, response);
                    this._at.command("+CGMM", this._update.bind(this));
                    this._at.command("+CGMR", this._update.bind(this));
                    this._at.command("+CGSN", this._update.bind(this));
                    this._at.command("$CHANNEL?", this._update.bind(this));

                } else {
                    this.emit("error", "This device is not COOPER RF Dongle.");
                    this._at.disconnect();
                }
            });

            return;
        }
        
        this._state = state;
        this.emit("state", this._state);
    }

    _atURC(line) {
        console.log("Gateway urc:", line);

        if (line.startsWith('$RECV:')) {
            let payload = this._decodeRECV(line);
            this.emit('recv', payload);
            return;
        }
    }

    _decodeRECV(line) {
        let payload = {};
        let values = line.slice(7).split(',');
        
        if (this._oldRecv) {
            for (let i=0, l=RECV_DECODE_V100.length; i < l; i++) {
                let decode = RECV_DECODE_V100[i];
                let value = values[i];
                payload[decode[0]] = value != "" ? decode[1](value) : null;
            }
        } else {

            for (let i=0, l=RECV_START.length; i < l; i++) {
                let decode = RECV_START[i];
                let value = values[i];
                payload[decode[0]] = value != "" ? decode[1](value) : null;
            }

            let recv_type = RECV_TYPE_LUT[payload['header']];

            if (recv_type) {
                delete payload['header']
                payload['type'] = recv_type['type'];
                let items = recv_type['items'];
                for (let i=0, l=items.length; i < l; i++) {
                    let decode = items[i];
                    let value = values[i + 5];
                    payload[decode[0]] = value != "" ? decode[1](value) : null;
                }
            }
        }

        return payload;
    }
}

module.exports = { Gateway, getSerialPortList, STATE_DISCONNECTED, STATE_CONNECTION, STATE_CONNECTED }
