<template>
  <div class="dongle">
    <div class="dongle-head">
      <div class="form-inline" id="dongleForm" v-if="$store.state.gateway.state == 'disconnected'">
        <label class="mr-sm-2" for="dongleSelect">Device: </label>
        <b-form-select v-model="selected" :options="select_serial_port_oprions" required class="mr-sm-2" />
        <!-- <div class="form-check mb-2 mr-sm-2">
          <input class="form-check-input" type="checkbox" id="dongleChoiceRemember">
          <label class="form-check-label" for="dongleChoiceRemember">
            Remember
          </label>
        </div> -->
        <b-button @click="connect" variant="success" >Connect</b-button>
      </div>

      <div v-if="$store.state.state == 'connection'">
      Connection ....
      </div>

       <button class="btn btn-danger" v-if="$store.state.gateway.state == 'connected'" @click="disconnect">Disconnect</button>
    </div>

    <div class="table-responsive">
    <table class="table" v-if="$store.state.gateway.state == 'connected'">
      <thead>
      <tr>
        <th></th>
        <th>Identifier<br/>&nbsp;</th>
        <th>Temperature<br/>[°C]</th>
        <th>Humidity<br/>[%]</th>
        <th>CO<sub>2</sub><br/>[ppm]</th>
        <th>Illuminance<br/>[lux]</th>
        <th>Pressure<br/>[Pa]</th>
        <th>VOC<br/>[ppm]</th>
        <th>Orientation<br/>&nbsp;</th>
        <th>Button<br/>[count]</th>
        <th>Sound&nbsp;level<br/>&nbsp;</th>
        <th>Motion<br/>[count]</th>
        <th>Battery<br/>[V]</th>
        <th>RSSI<br/>&nbsp;</th>
        <th>Time<br/>&nbsp;</th>
      </tr>
      </thead>
      <tbody >
      <tr v-for="sensor in $store.state.gateway.sensorList" v-bind:key="sensor.id">
        <td><b class="dtachSensor" @click="detachModalId=sensor.id; detachModalShow=true">✘</b></td>
        <td>{{sensor.id}}</td>
        <td>{{sensor.recv.beacon.temperature}}</td>
        <td>{{sensor.recv.beacon.humidity}}</td>
        <td>{{sensor.recv.beacon['co2_conc']}}</td>
        <td>{{sensor.recv.beacon.illuminance}}</td>
        <td>{{sensor.recv.beacon.pressure}}</td>
        <td>{{sensor.recv.beacon['voc_conc']}}</td>
        <td>{{sensor.recv.beacon.orientation}} </td>
        <td>{{sensor.recv.beacon['press_count']}} </td>
        <td>{{sensor.recv.beacon['sound_level']}}<span v-if="sensor.recv.sound.type" title="(min : max)">&nbsp;({{sensor.recv.sound['min']}}&nbsp;:&nbsp;{{sensor.recv.sound['max']}})</span></td>
        <td>{{sensor.recv.beacon['motion_count']}} </td>
        <td>{{sensor.recv.beacon.voltage}}</td>
        <td>{{sensor.recv.beacon.rssi}} </td>
        <td>{{sensor.recv.beacon.ts}}</td>
      </tr>
      </tbody>
    </table>
    </div>

    <b-modal v-model="detachModalShow" centered @ok="detachModalOk" title="Really detach this sensor?">
      Identifier: {{detachModalId}}
    </b-modal>

  </div>
</template>

<script>

export default {
  name: 'dongle',
  data () {
    return {
      selected: this.$store.state.gateway.device,
      detachModalId: null,
      detachModalShow: null
    }
  },
  components: {
  },
  created() {
  },
  computed: {
    select_serial_port_oprions: function () {
      let ret = [{ value: null, text: 'Choose...' }];

      let sensor_device = this.$store.state.sensor.state == 'connected' ? this.$store.state.sensor.device : null;

      this.$store.state.serial_port_list.forEach((item)=>{
        if(sensor_device == item.comName) return;
        if (item.serialNumber.indexOf('dongle') == -1) return;

        let text = item.comName;

        if (item.serialNumber.indexOf('hio') > -1) {
          text += ' ' + item.serialNumber;
        }

        ret.push({text: text, value: item.comName});
      });

      return ret;
    },
  },
  methods: {
    connect() {
      if (this.selected && this.selected.length) {
        this.$store.dispatch('gateway_connect', this.selected);
      }
    },
    detachModalOk() {
      this.$store.dispatch('gateway_sensor_detach', this.detachModalId);
    },
    disconnect() {
      this.$store.dispatch('gateway_disconnect');
    }
  }
}
</script>

<style>
.dongle-head  {
  padding: 10px;
}
.dtachSensor {
  cursor: pointer;
  color: #dc3545;
}
</style>