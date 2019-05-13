<template>
  <div class="sensor">
    
    <div class="form-inline" id="dongleForm" v-if="sensor.state == 'disconnected'">
      <label class="mr-sm-2" for="dongleSelect">Device: </label>
      <b-form-select v-model="selected" :options="select_serial_port_oprions" required class="mr-sm-2" />
      <b-button @click="connect" variant="success" >Connect</b-button>
    </div>

    <div v-if="sensor.state == 'connection'">
    Connection ....
    </div>

    <div v-if="sensor.state == 'connected'">
      <button class="btn btn-warning"  @click="disconnect">Disconnect</button>
    </div>

    <br/>

    <b-jumbotron>
    <template slot="header">
      {{sensor.model || '???'}}
    </template>
    <template slot="lead">
      Id: {{sensor.id}}<br/>
      Firmware version: {{sensor.firmwareVersion}}<br/>
      Channel: {{sensor.channel}}<br/>
    </template>
    <hr class="my-4">
    <p></p>
    <div v-if="isGatewayConnected && sensor.id">
      <b-button variant="success"  v-if="!inGatewaySensorList" @click="attach">Attach Sensor</b-button>
      <b-button variant="danger" v-if="inGatewaySensorList" @click="detach">Detach Sensor</b-button>
    </div>
  </b-jumbotron>

    <b-modal v-model="detachModalShow" centered @ok="detachModalOk" title="Really detach this Sensor?">
      Id: {{sensor.id}}
    </b-modal>

  </div>

</template>

<script>
// import { ipcRenderer } from 'electron';

export default {
  name: 'Sensor',
  data () {
    return {
      selected: this.$store.state.sensor.device,
      sensor: this.$store.state.sensor,
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
    inGatewaySensorList(){
      let list = this.$store.state.gateway.sensorList;
      for(let i=0,l=list.length;i<l;i++){
        if (list[i].id == this.sensor.id) return true;
      }
      return false;
    }
  },
  methods: {
    connect() {
      if (this.selected && this.selected.length) {
        this.$store.dispatch('sensor_connect', this.selected);
      }
    },
    disconnect() {
      this.$store.dispatch('sensor_disconnect');
    },
    attach() {
      this.$store.dispatch('gateway_sensor_attach');
    },
    detach() {
      this.detachModalShow = true;
    },
    detachModalOk() {
      this.$store.dispatch('gateway_sensor_detach', this.sensor.id);
    }
  }
}
</script>

<style>
.sensor {
  padding: 10px;
}
</style>