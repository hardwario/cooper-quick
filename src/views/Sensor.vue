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

    <div v-if="isConnected">
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
      <span v-if="isRFSensor">Channel: {{sensor.channel}}</span><br/>
    </template>
    
    <div v-if="isGatewayConnected && sensor.id">
      <hr class="my-4">

      <b-button variant="success"  v-if="isRFSensor && !inGatewaySensorList" @click="attach">Attach Sensor</b-button>
      <b-button variant="danger" v-if="inGatewaySensorList" @click="detach">Detach Sensor</b-button>

      <div v-if="isConnected" style="display: inline">
      &nbsp; 
      &nbsp; 
      &nbsp; 
      <b-button type="submit" variant="success" size="sm" @click="send">Send data</b-button>
      &nbsp; 
      <b-button type="submit" variant="success" size="sm" @click="pulse">Pulse</b-button>
      &nbsp; 
      <b-button type="submit" variant="success" size="sm" @click="beep">Beep</b-button>  
      </div>  

    </div>

    <div v-if="isConnected">

      <hr class="my-4">

      <div class="row">
        <div class="col-sm" style="max-width:400px">
          <h4>Status</h4>
          <table class="table table-sm">
          <tr v-for="line in status" v-bind:key="line[0]">
            <td>{{line[0]}}</td>
            <td>{{line[1]}}</td>
          </tr>
          </table>
          <b-button size="sm" variant="" @click="statusRefresh">Refresh</b-button>  
        </div>
        <div class="col-sm" style="max-width:400px">
          <h4>Config</h4>
          <table class="table table-sm">
          <tr v-for="line in sensor.config" v-bind:key="line[0]+line[1]">
            <td>{{line[1]}}</td>
            <td>{{line[0]}}</td>
            <td>{{line[2]}}</td>
          </tr>
          </table>
           <b-button size="sm" variant="" @click="dumpConfig">Save to file</b-button>  
        </div>
      </div>
    </div>
  </b-jumbotron>

    <b-modal v-model="detachModalShow" centered @ok="detachModalOk" title="Really detach this Sensor?">
      Id: {{sensor.id}}
    </b-modal>

  </div>

</template>

<script>
import { ipcRenderer } from 'electron';
import { remote } from 'electron';
var fs = require('fs');

export default {
  name: 'Sensor',
  data () {
    return {
      selected: this.$store.state.sensor.device,
      sensor: this.$store.state.sensor,
      detachModalShow: false,
      status: []
    }
  },
  created() {
  },
  async mounted(){
    this.statusRefresh();
  },
  computed: {
    isConnected(){
      return this.sensor.state == 'connected';
    },
    isGatewayConnected(){
      return this.$store.state.gateway.state == 'connected';
    },
    select_serial_port_oprions: function () {
      let ret = [{ value: null, text: 'Choose...' }];

      let gateway_device = this.isGatewayConnected ? this.$store.state.gateway.device : null;

      this.$store.state.serial_port_list.forEach((item)=>{
        if (gateway_device == item.comName) return;
        if (item.serialNumber.indexOf('dongle') > -1) return;

        let text = item.comName

        if (item.serialNumber.indexOf('cooper') > -1) {
          text += ' ' + item.serialNumber;
        }

        ret.push({text: text, value: item.comName});
      });

      return ret;
    },
    inGatewaySensorList(){
      let list = this.$store.state.gateway.sensorList;
      for(let i=0,l=list.length;i<l;i++){
        if (list[i].id == this.sensor.id) return true;
      }
      return false;
    },
    isRFSensor(){
      return this.sensor.model && (this.sensor.model.indexOf('RF') > -1 || this.sensor.model == "COOPER R1.1");
    },
    urc(){
      return this.sensor.urc;
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
    },
    command(command) {
      if (!this.isConnected) return undefined;
      return ipcRenderer.sendSync('sync/sensor/command', command);
    },
    send() {
      this.command('$SEND');
    },
    pulse() {
      this.command('$PULSE');
    },
    beep() {
      this.command('$BEEP');
    },
    statusRefresh() {
      let status = this.command('$STATUS') || [];
      this.status = status.map((line)=>{
        line = line.slice(9).split(',');
        line[0] = line[0].slice(1, -1);
        if (line[0] === 'Acceleration') {
          line[1] = line.slice(1);
        }
        return line;
      })
    },
    configRefresh() {
      let config = this.command('$CONFIG') || [];
      this.sensor.config = config.map((line)=>{
        line = line.slice(9).split(',');
        line[0] = line[0].slice(1, -1);
        return line;
      })
      console.log(this.sensor.config);
    },
    dumpConfig () {
      remote.dialog.showSaveDialog({defaultPath: "config.yml"}, function (fileName) {
        if (fileName === undefined) return;

        let key = this.command('$KEY?');
        if (key[0].startsWith("$KEY: ")) {
          key = key[0].slice(6);
        } else {
          key = null;
        }

        let yml = "channel: " + this.sensor.channel + "\n";
        yml += "key: " + key + "\n";
        yml += "timetable: \n";

        let n = null;
        for (let i=0, l=this.sensor.config.length; i<l; i++) {
          let line = this.sensor.config[i];
          if (n != line[1]) {
            n = line[1];
            yml += "  " + line[1] + ":\n";
          }
          yml += "    " + line[0] + ": " + line[2] + "\n";
        }

        fs.writeFile(fileName, yml, function (err) {  
          if (err) {
            alert(err);
          } 
        });
      }.bind(this)); 
    }
  },
  watch:{
    isConnected: function(state){
      if (state) {
        this.statusRefresh();
        this.configRefresh();
      }
    }
    // urc: function(state){
    //   if (state){
    //     this.statusRefresh();
    //   }
    // }
  }
}
</script>

<style>
.sensor {
  padding: 10px;
}

.flowBox::after {
    display: block;
    clear: both;
    content: "";
}
</style>