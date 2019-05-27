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

       <button class="btn btn-danger" v-if="$store.state.gateway.state == 'connected'" @click="disconnect">Disconnect Dongle</button>
    </div>

    <div class="table-responsive">
    <table class="table" v-if="$store.state.gateway.state == 'connected'">
      <thead>
      <tr>
        <th>Id</th>
        <th>Temperature</th>
        <th>Humidity </th>
        <th>CO<sub>2</sub> </th>
        <th>Illuminance </th>
        <th>Pressure </th>
        <th>VOC </th>
        <th>Orientation </th>
        <th>Button</th>
        <th>Sound level </th>
        <th>Motion count </th>
        <th>Battery </th>
        <th>RSSI </th>
        <th>Time</th>
        <th style="width:130px"></th>
      </tr>
      </thead>
      <tbody >
      <tr v-for="sensor in $store.state.gateway.sensorList" v-bind:key="sensor">
        <td>{{sensor.id}}</td>
        <td>{{sensor.recv.temperature}} °C </td>
        <td>{{sensor.recv.humidity}} % </td>
        <td>{{sensor.recv['co2_conc']}} ppm </td>
        <td>{{sensor.recv.illuminance}} lux </td>
        <td>{{sensor.recv.pressure}} Pa </td>
        <td>{{sensor.recv['voc_conc']}} ppm </td>
        <td>{{sensor.recv.orientation}} </td>
        <td>{{sensor.recv['press_count']}} </td>
        <td>{{sensor.recv['sound_level']}} </td>
        <td>{{sensor.recv['motion_count']}} </td>
        <td>{{sensor.recv.voltage}} V</td>
        <td>{{sensor.recv.rssi}} </td>
        <td>{{sensor.recv.ts}}</td>
        <td>
          <b-button @click="detachModalId=sensor.id; detachModalShow=true" variant="" ><font-awesome-icon icon="times" /></b-button>
          <!--&nbsp;
          <b-button @click="detachModalId=sensor.id; detachModalShow=true" variant="" ><font-awesome-icon icon="cog" /></b-button>-->
        </td>
      </tr>
      </tbody>
    </table>
    </div>


    <b-modal v-model="detachModalShow" centered @ok="detachModalOk" title="Really detach this Sensor?">
      Id: {{detachModalId}}
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
</style>