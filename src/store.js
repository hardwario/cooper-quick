import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'
import { ipcRenderer } from 'electron'
import moment from 'moment'

Vue.use(Vuex);

export default function getStore() {
  
  let store = new Vuex.Store({
    state: {
      state: "disconnected",
      device: null,
      serial_port_list: [],
      node_list: [],
    },
    mutations: {
      serial_port_list(state, ports) {
        state.serial_port_list = ports;
      },
      gateway_state(state, gwstate) {
        state.state = gwstate;
      },
      node_list(state, list) {
        state.node_list = list;
      },
      gateway_recv(state, payload) {
        for (let i = 0; i < state.node_list.length; i++) {
          let node = state.node_list[i];
          if (node.id == payload.id) {
            payload.ts = new moment().format('MM/DD/YYYY hh:mm:ss');
            node.recv = payload;
          }
        }
      },
      device(state, device) {
        state.device = device;
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
        ipcRenderer.send('gateway/connect', device); 
        this.commit('device', device);
      },
      gateway_disconnect(context) {
        console.log('action gateway_disconnect')
        ipcRenderer.send('gateway/disconnect'); 
      },
      node_list_get() {
        ipcRenderer.send('node/list/get');
      }
    },
    plugins: [createLogger()]
  });

  ipcRenderer.on('port-list', (sender, ports) => {
    store.commit('serial_port_list', ports);
  });

  ipcRenderer.on('gateway/state', (sender, state) => {
    store.commit('gateway_state', state);
    
    if (state == 'connected') {
      store.dispatch('node_list_get');
    }
  });

  ipcRenderer.on('node/list', (sender, list) => {
    store.commit('node_list', list);
  });

  ipcRenderer.on('gateway/recv', (sender, payload) => {
    store.commit('gateway_recv', payload);
  });
  
  return store;
}

