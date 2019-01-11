<template>
  <div class="node">
    
    <div class="form-inline" id="dongleForm" v-if="node.state == 'disconnected'">
      <label class="mr-sm-2" for="dongleSelect">Device: </label>
      <b-form-select v-model="selected" :options="select_serial_port_oprions" required class="mr-sm-2" />
      <b-button @click="connect" variant="success" >Connect</b-button>
    </div>

    <div v-if="node.state == 'connection'">
    Connection ....
    </div>

    <div v-if="node.state == 'connected'">
      <button class="btn btn-warning"  @click="disconnect">Disconnect</button>
    </div>

    <br/>

    <b-jumbotron>
    <template slot="header">
      {{node.model || '???'}}
    </template>
    <template slot="lead">
      Id: {{node.id}}<br/>
      Firmware version: {{node.firmwareVersion}}<br/>
      Channel: {{node.channel}}<br/>
    </template>
    <hr class="my-4">
    <p></p>
    <div v-if="isGatewayConnected && node.id">
      <b-button variant="success"  v-if="!inGatewayNodeList" @click="attach">Attach node</b-button>
      <b-button variant="danger" v-if="inGatewayNodeList" @click="detach">Detach node</b-button>
    </div>
  </b-jumbotron>

    <b-modal v-model="detachModalShow" centered @ok="detachModalOk" title="Really detach this node?">
      Id: {{node.id}}
    </b-modal>

  </div>

</template>

<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'node',
  data () {
    return {
      selected: this.$store.state.node.device,
      node: this.$store.state.node,
      detachModalShow: false
    }
  },
  created() {
  },
  computed: {
    isGatewayConnected(){
      return this.$store.state.gateway.state == 'connected';
    },
    select_serial_port_oprions: function () {
      let ret = [{ value: null, text: 'Choose...' }];

      let gateway_device = this.isGatewayConnected ? this.$store.state.gateway.device : null;

      this.$store.state.serial_port_list.forEach((item)=>{
        if (gateway_device == item.comName) return;
        ret.push({text: item.comName, value: item.comName});
      });

      return ret;
    },
    inGatewayNodeList(){
      let list = this.$store.state.gateway.nodeList;
      for(let i=0,l=list.length;i<l;i++){
        if (list[i].id == this.node.id) return true;
      }
      return false;
    }
  },
  methods: {
    connect() {
      if (this.selected && this.selected.length) {
        this.$store.dispatch('node_connect', this.selected);
      }
    },
    disconnect() {
      this.$store.dispatch('node_disconnect');
    },
    attach() {
      this.$store.dispatch('gateway_node_attach');
    },
    detach() {
      this.detachModalShow = true;
    },
    detachModalOk() {
      this.$store.dispatch('gateway_node_detach', this.node.id);
    }
  }
}
</script>

<style>
.node {
  padding: 10px;
}
</style>