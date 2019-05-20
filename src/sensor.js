"use strict";

const EventEmitter = require('events');
const { ATClient, getSerialPortList, STATE_DISCONNECTED, STATE_CONNECTION, STATE_CONNECTED } = require("./atclient");

class Sensor extends EventEmitter {
    constructor(device) {
        super();

        this._state = STATE_DISCONNECTED;
        this._at = new ATClient(device);
        this._at.on('state', this._atStateChange.bind(this));
        this._at.on('urc', this._atURC.bind(this));
        this._at.on('error', (msg)=>{
            this.emit('error', msg)
        });

        this.setKey = this.setKey.bind(this);
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

    send(){
        return this._at.commandp("$SEND");
    }

    setKey(key){
        return new Promise((resolve, reject)=>{
            if (key.length != 32){
                return reject("Key has bad length.");
            }
            this._at.commandp('$KEY=' + key)
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
            this.firmware_version = value;
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

                if (!response || (!/COOPER (RF Sensor|SF|LR|NB|IQ) R\d+\.\d+ v.+?/.test(response[0]) && !/COOPER R1\.\d \d\.\d\.\d/.test(response[0]))) {
                    this.emit("error", "This device is not COOPER Sensor.");
                    this._at.disconnect();
                    return;
                }

                this._state = STATE_CONNECTED;

                this.emit("state", this._state);

                this._attributes = {}

                this._update(command, response);

                this._at.command("+CGMM", this._update.bind(this));
                this._at.command("+CGMR", this._update.bind(this));
                this._at.command("+CGSN", this._update.bind(this));
                this._at.command("$CHANNEL?", this._update.bind(this));
            });

            return;
        }
        
        this._state = state;
        this.emit("state", this._state);
    }

    _atURC(line) {
        //console.log("Sensor urc:", line);
        if (line.startsWith('+CGSN:')) {
            this._update("+CGSN", [line]);
        } else {
            this.emit("urc", line);
        }
    }
}


module.exports = { Sensor, getSerialPortList, STATE_DISCONNECTED, STATE_CONNECTION, STATE_CONNECTED }
