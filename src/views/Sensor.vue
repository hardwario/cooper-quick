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
      Identifier: {{sensor.id}}<br/>
      Firmware version: {{sensor.firmwareVersion}}<br/>
      <span v-if="isRFSensor">Channel: {{sensor.channel}}</span><br/>
    </template>
    
    <div v-if="isGatewayConnected && sensor.id">
      <hr class="my-4">

      <b-button variant="success" v-if="isRFSensor && !inGatewaySensorList" @click="attach">Attach sensor</b-button>
      <b-button variant="danger" size="sm" v-if="inGatewaySensorList" @click="detach">Detach sensor</b-button>

      <div v-if="isConnected" style="display: inline">
      &nbsp; 
      &nbsp; 
      &nbsp; 
      <b-button type="submit" variant="success" size="sm" @click="send">send data</b-button>
      &nbsp; 
      <b-button type="submit" variant="success" size="sm" @click="pulse">pulse</b-button>
      &nbsp; 
      <b-button type="submit" variant="success" size="sm" @click="beep">beep</b-button>  
      </div>  

    </div>

    <div v-if="isConnected">

      <hr class="my-4">

      <div class="row">
        <div class="col-sm" style="max-width:400px">
          <h4>Status</h4>
          <table class="table table-sm">
          <tr v-for="line in status" v-bind:key="line[0]">
            <td>{{line[0]}}&nbsp;{{units[line[0]]}}</td>
            <td>{{line[1]}}</td>
          </tr>
          </table>
          <b-button size="sm" variant="" @click="statusRefresh">Refresh</b-button>  
        </div>
        <div class="col-sm" style="max-width:400px">
          <h4>Configuration</h4>
          <table class="table table-sm">
          <template v-for="(timetable, i) in sensor.config" >
            <tr v-bind:key="i">
              <td colspan="3">Timetable {{i}}</td>
            </tr>
          
            <tr v-for="(value, name) in timetable" v-bind:key="i + name">
              <td></td>
              <td>{{name}}</td>
              <td>{{value}}</td>
            </tr>

          </template>
          </table>
           <b-button size="sm" variant="" @click="dumpConfig">Save to file...</b-button>  
        </div>
      </div>

      <br />
      <br />
      
      <b-button size="sm" variant="" @click="dumpSnapshot">Snapshot to file...</b-button> 
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
import YAML from 'yaml'
var fs = require('fs');

const UNITS = {
  Acceleration: "[g]",
  Altitude:	"[m]",
  "CO2 Concentration": "[ppm]",
  Humidity: "[%]",
  Illuminance: "[lux]",
  Orientation: "",
  "Press Count": "",
  Pressure: "[Pa]",
  "Sound Level": "",
  Temperature: "[°C]",
  "VOC Concentration": "[ppm]",
  Voltage: "[V]",
  "Motion Count": ""
};

function trim(str, char='"') {
    if (str.charAt(0) === char && str.charAt(str.length -1) === char) {
        return str.substr(1,str.length -2);
    }
    return str;
}

export default {
  name: 'Sensor',
  data () {
    return {
      selected: this.$store.state.sensor.device,
      sensor: this.$store.state.sensor,
      detachModalShow: false,
      status: [],
      units: UNITS
    }
  },
  created() {
  },
  async mounted(){
    this.statusRefresh();

        this.snapshotYml();
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
          return [line[0], line.slice(1).join(' / ')]
        }
        return line;
      })
    },
    configRefresh() {
      let response = this.command('$CONFIG') || [];
      let config = {};

      let n = null;
      for (let i=0, l=response.length; i<l; i++) {
        let line = response[i];
        line = line.slice(9).split(',');
        line[0] = line[0].slice(1, -1);

        if (n != line[1]) {
          config[parseInt(line[1])] = {};
          n = line[1];
        }
        let value = line[2].replace(/(^\s+|\s+$)/g,'');

        if (value.charAt(0) === '"' && value.charAt(value.length -1) === '"') {
            value = value.substr(1,value.length -2);
        } else {
          value = parseInt(value);
        }
        
        config[parseInt(line[1])][line[0]] = value;
      }
      this.sensor.config = config;
    },
    configYml() {
      return YAML.stringify({timetable: this.sensor.config});
    },
    dumpConfig () {
      remote.dialog.showSaveDialog({defaultPath: "config.yml"}, function (fileName) {
        if (fileName === undefined) return;
        fs.writeFile(fileName, this.configYml(), function (err) {  
          if (err) {
            alert(err);
          } 
        });
      }.bind(this)); 
    },
    atGet(name) {
      let response = this.command('$' + name + '?');
      if (response && response[0].startsWith("$" + name + ": ")) {
        return trim(response[0].slice(name.length + 3));
      }
      return null;
    },
    snapshotYml() {
      let snapshot = {
        device: {
          identifier: this.sensor.id,
          model: this.sensor.model,
          firmwareVersion: this.sensor.firmwareVersion,
        },
        rf: {
          key: this.atGet('KEY'),
          channel: this.sensor.channel,
        },
        config: {timetable: this.sensor.config},
        status: this.status
      };
      return YAML.stringify(snapshot);
    },
    dumpSnapshot() {
      remote.dialog.showSaveDialog({defaultPath: "snapshot-" + this.sensor.id +  ".yml"}, function (fileName) {
        if (fileName === undefined) return;
        fs.writeFile(fileName, this.snapshotYml(), function (err) {  
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