import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'
import { ipcRenderer } from 'electron'
import moment from 'moment'

Vue.use(Vuex);

export default function getStore() {
  
  let store = new Vuex.Store({
    state: {
      serial_port_list: [],
      error: null,
      messages: [],
      gateway: {
        state: "disconnected",
        device: null,
        sensorList: [],
        firmwareVersion: null,
        id: null,
        channel: null
      },
      sensor: {
        state: "disconnected",
        device: null,
        firmwareVersion: null,
        id: null,
        channel: null,
        model: null,
        urc: null,
        config: null
      },
      bussy: false
    },

    mutations: {
      serial_port_list(state, ports) {
        state.serial_port_list = ports;
      },
      gateway_state(state, gwstate) {
        state.gateway.state = gwstate;
      },
      gateway_sensor_list(state, list) {
        for (let j in list) {
          let sensor = list[j];
          for (let i in state.gateway.sensorList) {
            let oldSensor = state.gateway.sensorList[i];
            if (sensor.id == oldSensor.id) {
              sensor.recv = oldSensor.recv;
              break;
            }
          }
        }
        state.gateway.sensorList = list;
      },
      gateway_recv(state, payload) {
        for (let i = 0; i < state.gateway.sensorList.length; i++) {
          let sensor = state.gateway.sensorList[i];
          if (sensor.id == payload.id) {
            payload.ts = new moment().format('MM/DD/YYYY hh:mm:ss');
            sensor.recv[payload.type] = payload;
          }
        }
      },
      error(state, message) {
        state.error = message;
      },
      gateway_update(state, payload) {
        state.gateway = Object.assign(state.gateway, payload);
      },
      sensor_update(state, payload) {
        if (payload.state && payload.state == "disconnected") {
          payload.firmwareVersion = null;
          payload.id = null;
          payload.channel = null;
          payload.model = null;
          payload.urc = null;
          payload.config = null;
        }
        state.sensor = Object.assign(state.sensor, payload);
      },
      sensor_urc(state, payload) {
        state.sensor.urc = {line: payload, ts: new moment().format('MM/DD/YYYY hh:mm:ss')};
      },
      add_message(state, payload) {
        payload.show = true;
        payload.id = state.messages.length;
        setTimeout(()=>{
          payload.show = false;
        }, 2000);
        state.messages.push(payload);
      },
    },

    actions: {
      update_serial_port_list() {
        ipcRenderer.send('port-list/get'); 
      },
      gateway_state_get() {
        ipcRenderer.send('gateway/state/get'); 
      },
      gateway_connect(context, device) {
        this.commit('gateway_update', {device});
        this.commit('error', null);
        ipcRenderer.send('gateway/connect', device); 
      },
      gateway_disconnect() {
        ipcRenderer.send('gateway/disconnect'); 
      },
      gateway_sensor_list_get() {
        ipcRenderer.send('gateway/sensor/list/get');
      },
      gateway_sensor_attach() {
        ipcRenderer.send('gateway/sensor/attach');
      },
      gateway_sensor_detach(context, id) {
        ipcRenderer.send('gateway/sensor/detach', id);
      },
      sensor_connect(context, device) {
        this.commit('sensor_update', {device});
        this.commit('error', null);
        ipcRenderer.send('sensor/connect', device); 
      },
      sensor_disconnect() {
        ipcRenderer.send('sensor/disconnect'); 
      },
      add_message_success(context, msg) {
        this.commit("add_message", {type: "success", msg});
      },
      add_message_error(context, msg) {
        this.commit("add_message", {type: "danger", msg});
      },
    },

    plugins: [createLogger()]
  });

  ipcRenderer.on('port-list', (sender, ports) => {
    store.commit('serial_port_list', ports);
  });

  ipcRenderer.on('gateway/state', (sender, state) => {
    store.commit('gateway_state', state);
    
    if (state == 'connected') {
      store.dispatch('gateway_sensor_list_get');
    }
  });

  ipcRenderer.on('gateway/sensor/list', (sender, list) => {
    store.commit('gateway_sensor_list', list);
  });

  ipcRenderer.on('gateway/recv', (sender, payload) => {
    store.commit('gateway_recv', payload);
  });

  ipcRenderer.on('error', (sender, message) => {
    store.commit('error', message);
  });

  ipcRenderer.on('sensor-update', (sender, payload) => {
    store.commit('sensor_update', payload);
  });

  ipcRenderer.on('sensor-urc', (sender, payload) => {
    store.commit('sensor_urc', payload);
  });

  ipcRenderer.on('gateway-update', (sender, payload) => {
    store.commit('gateway_update', payload);
  });

  return store;
}

