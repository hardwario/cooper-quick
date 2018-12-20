"use strict";

const SerialPort = require("serialport");
const EventEmitter = require('events');

const STATE_DISCONNECTED = "disconnected";
const STATE_CONNECTION = "connection";
const STATE_CONNECTED = "connected";

class ATClient extends EventEmitter {
    constructor(device) {
        super();

        this._device = device;
        this._state = STATE_DISCONNECTED;
        this._comands = [];
        this._response = null;
        this._command = null;

        this._ser = new SerialPort(device, {
            autoOpen: false,
            baudRate: 115200,
            parity: "none",
        });

        this._ser.on("open", () => {

            this._ser.flush(() => {
                this._write('\x1b');

                this._write("AT");

                this._timeout = setTimeout(()=>{
                    this.emit("error", "There is no answer from the device. Please, make sure the device is the Radio Dongle and has the correct firmware.");
                    this.disconnect();
                }, 5000);

            });
        });

        this._ser.on("close", () => {
            this._state = STATE_DISCONNECTED;
            this.emit("state", this._state);
        });
        this._ser.on("error", (e) => {
            self.emit("error", e);
        });

        const parser = this._ser.pipe(new SerialPort.parsers.Readline({ delimiter: "\r\n" }));
        parser.on("data", this._device_readline.bind(this));
    }

    connect() {
        if (this._state != STATE_DISCONNECTED) return false;

        this._state = STATE_CONNECTION;
        this.emit("state", this._state);

        this._ser.open((error)=>{
            if (error) console.log("open error", error);
        });

        return true;
    }

    disconnect() {
        if (this._state == STATE_DISCONNECTED) return false;

        this._ser.close((error)=>{
            if (error) console.log("close error", error);
        });

        return true;
    }

    getDevice() {
        return this._device;
    }

    getState() {
        return this._state;
    }

    command(command, callback, timeout=1000) {
        this._comands.push([command, callback, timeout]);

        if ((this._state == STATE_CONNECTED) && (this._command == null)) {
            this._next_command();
        }
    }

    _next_command() {
        if (this._command != null) {
            clearTimeout(this._timeout);
            if (this._command[1]) this._command[1](this._command[0], this._response); 
            this._command = null;
        }
        
        if (this._comands.length > 0) {
            let command = this._comands.shift();

            this._response = [];
            this._command = command;
            this._write('AT' + command[0]);

            this._timeout = setTimeout(()=>{
                this._response = null;
                this._next_command();
            }, this._command[2]);
        }
    }

    _write(line, callback=undefined) {
        console.log("ATClient write:", line);
        this._ser.write(line + '\r\n', callback);
    }

    _device_readline(line) {
        console.log("ATClient read:", line);

        if (line.length == 0) return;

        if (this._state == STATE_CONNECTION) {
            if (line == 'OK') {
                
                clearTimeout(this._timeout);
                this._timeout = null;

                this._comands = [];
                this._command = null;

                this._state = STATE_CONNECTED;
                this.emit("state", this._state);
            }

            return;
        }

        if (this._command != null) {
            if (line == 'OK') {
                this._next_command();
            } else if (line == 'ERROR') {
                this._response = null;
                this._next_command();
            } else {
                this._response.push(line);
            }

            return;
        }
        
        this.emit('urc', line);
    }
}

function port_list(callback) {
    SerialPort.list()
        .then((ports) => {

            // for (let i=0, l=ports.length; i<l; i++) {
            //     console.log(ports[i].serialNumber);
            // }

            callback(ports.filter((port) => {
                return port.manufacturer == "0403" || port.vendorId == "0403";
            }));
        })
        .catch(() => {
            callback([]);
        });
}

module.exports = { ATClient, port_list, STATE_DISCONNECTED, STATE_CONNECTION, STATE_CONNECTED }
