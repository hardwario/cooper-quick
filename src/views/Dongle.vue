<template>
  <div class="dongle">
    <div class="dongle-head">
      <div class="form-inline" id="dongleForm" v-if="$store.state.gateway.state == 'disconnected'">
        <label class="mr-sm-2" for="dongleSelect">Dongle: </label>
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

       <button class="btn btn-danger" v-if="$store.state.gateway.state == 'connected'" @click="disconnect">Disconnect dongle</button>
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
        <th></th>
      </tr>
      </thead>
      <tbody >
      <tr v-for="node in $store.state.gateway.nodeList">
        <td>{{node.id}}</td>
        <td>{{node.recv.temperature}} °C </td>
        <td>{{node.recv.humidity}} % </td>
        <td>{{node.recv['co2-conc']}} ppm </td>
        <td>{{node.recv.illuminance}} lux </td>
        <td>{{node.recv.pressure}} Pa </td>
        <td>{{node.recv['voc-conc']}} ppm </td>
        <td>{{node.recv.orientation}} </td>
        <td>{{node.recv['press-count']}} </td>
        <td>{{node.recv['sound-level']}} </td>
        <td>{{node.recv['motion-count']}} </td>
        <td>{{node.recv.voltage}} V</td>
        <td>{{node.recv.rssi}} </td>
        <td>{{node.recv.ts}}</td>
        <td><b-button @click="detachModalId=node.id; detachModalShow=true" variant="" ><font-awesome-icon icon="times" /></b-button></td>
      </tr>
      </tbody>
    </table>
    </div>


    <b-modal v-model="detachModalShow" centered @ok="detachModalOk" title="Really detach this node?">
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

      let node_device = this.$store.state.node.state == 'connected' ? this.$store.state.node.device : null;

      this.$store.state.serial_port_list.forEach((item)=>{
        if(node_device == item.comName) return;
        ret.push({text: item.comName, value: item.comName});
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
      this.$store.dispatch('gateway_node_detach', this.detachModalId);
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