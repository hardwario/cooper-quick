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
      gateway: {
        state: "disconnected",
        device: null,
        nodeList: [],
        firmwareVersion: null,
        id: null,
        channel: null
      },
      node: {
        state: "disconnected",
        device: null,
        firmwareVersion: null,
        id: null,
        channel: null,
        model: null
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
      gateway_node_list(state, list) {
        state.gateway.nodeList = list;
      },
      gateway_recv(state, payload) {
        for (let i = 0; i < state.gateway.nodeList.length; i++) {
          let node = state.gateway.nodeList[i];
          if (node.id == payload.id) {
            payload.ts = new moment().format('MM/DD/YYYY hh:mm:ss');
            node.recv = payload;
          }
        }
      },
      error(state, message) {
        state.error = message;
      },
      gateway_update(state, payload) {
        state.gateway = Object.assign(state.gateway, payload);
      },
      node_update(state, payload) {
        if (payload.state && payload.state == "disconnected") {
          payload.firmwareVersion = null;
          payload.id = null;
          payload.channel = null;
          payload.model = null
        }
        state.node = Object.assign(state.node, payload);
      }
    },

    actions: {
      update_serial_port_list() {
        console.log('action update_serial_port_list')
        ipcRenderer.send('port-list/get'); 
      },
      gateway_state_get() {
        console.log('action gateway_state_get')
        ipcRenderer.send('gateway/state/get'); 
      },
      gateway_connect(context, device) {
        console.log('action gateway_connect', device)
        this.commit('gateway_update', {device});
        this.commit('error', null);
        ipcRenderer.send('gateway/connect', device); 
      },
      gateway_disconnect() {
        console.log('action gateway_disconnect')
        ipcRenderer.send('gateway/disconnect'); 
      },
      gateway_node_list_get() {
        ipcRenderer.send('gateway/node/list/get');
      },
      gateway_node_attach() {
        ipcRenderer.send('gateway/node/attach');
      },
      gateway_node_detach(context, id) {
        ipcRenderer.send('gateway/node/detach', id);
      },
      node_connect(context, device) {
        console.log('action node_connect', device)
        this.commit('node_update', {device});
        this.commit('error', null);
        ipcRenderer.send('node/connect', device); 
      },
      node_disconnect() {
        console.log('action node_disconnect')
        ipcRenderer.send('node/disconnect'); 
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
      store.dispatch('gateway_node_list_get');
    }
  });

  ipcRenderer.on('gateway/node/list', (sender, list) => {
    store.commit('gateway_node_list', list);
  });

  ipcRenderer.on('gateway/recv', (sender, payload) => {
    store.commit('gateway_recv', payload);
  });

  ipcRenderer.on('error', (sender, message) => {
    store.commit('error', message);
  });

  ipcRenderer.on('node-update', (sender, payload) => {
    store.commit('node_update', payload);
  });
  ipcRenderer.on('gateway-update', (sender, payload) => {
    store.commit('gateway_update', payload);
  });

  return store;
}

