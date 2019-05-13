<template>
  <div class="config">

   <h2>Azure IOT Central</h2>
    
    <b-form @submit="onSubmitAzureiotcentral" >
      <b-form-group id="azureiotcentralChecks">
          <b-form-checkbox v-model="azureiotcentral.enable">Enable</b-form-checkbox>
      </b-form-group>

      <b-form-group label-for="azureiotcentralInputScopeID"
                    label="For Device:">
      <b-form-select v-model="azureiotcentral.selected" :options="azureiotcentralDeviceOptions" @input="azureiotcentralDeviceChange" class="mb-3" />
      </b-form-group>

      <b-form-group label-for="azureiotcentralInputScopeID" 
                    label="Scope ID:" label-size="sm">
        <b-form-input id="azureiotcentralInputScopeID" size="sm"
                      type="text"
                      v-model="azureiotcentral.device.scopeId"
                      required
                      placeholder="...">
        </b-form-input>
      </b-form-group>

      <b-form-group label-for="azureiotcentralInputDeviceId"
                    label="Device ID:" label-size="sm">
        <b-form-input id="azureiotcentralInputDeviceId" size="sm"
                      type="text"
                      v-model="azureiotcentral.device.deviceId"
                      required
                      placeholder="...">
        </b-form-input>
      </b-form-group>

      <b-form-group label-for="azureiotcentralInputPrimaryKey" 
                    label="Primary Key:" label-size="sm">
        <b-form-input id="azureiotcentralInputPrimaryKey" size="sm"
                      type="text"
                      v-model="azureiotcentral.device.primaryKey"
                      required
                      placeholder="...">
        </b-form-input>
      </b-form-group>

        <b-form-group label-for="azureiotcentralInputConnectionString"
                    label="Connection String:" label-size="sm">

        <b-button variant="primary" size="sm" @click="azureiotcentralGetConnectionString" :disabled="azureiotcentral.wait" >Get Connection String <font-awesome-icon v-if="azureiotcentral.wait" spin icon="spinner" /></b-button>

        <b-form-input id="azureiotcentralInputConnectionString"
                      type="text"
                      v-model="azureiotcentral.device.connectionString"
                      required
                      placeholder="..." size="sm">
        </b-form-input>
      </b-form-group>

      <b-button type="submit" variant="success" :disabled="azureiotcentral.wait">Save</b-button>
    </b-form>

    <hr />
    
    <h2>Ubidots</h2>
    
    <b-form @submit="onSubmitUbidots">
      <b-form-group id="ubidotsChecks">
          <b-form-checkbox v-model="ubidots.enable">Enable</b-form-checkbox>
      </b-form-group>

      <b-form-group label-for="ubidotsInput"
                    label="Auth Token:" >
        <b-form-input id="ubidotsInput"
                      type="text"
                      v-model="ubidots.auth_token"
                      required
                      placeholder="...">
        </b-form-input>
      </b-form-group>

      <b-button type="submit" variant="success">Save</b-button>
    </b-form>

  </div>
</template>

<script>
import { ipcRenderer } from 'electron';

function config_get (section, key){
  return ipcRenderer.sendSync('sync/settings/get', {section, key})
}

function config_set(section, key, value) {
  return ipcRenderer.sendSync('sync/settings/set', {section, key, value})
}

export default {
  name: 'connectors',
  data () {
    return {
      ubidots: config_get('ubidots'),
      azureiotcentral: {
        enable: config_get('azureiotcentral', 'enable'),
        devices: config_get('azureiotcentral', 'devices'),
        device: {},
        selected: null,
        wait: false
      }
    }
  },
  mounted() {
    ipcRenderer.on('azureiotcentral/connectionString', function(sender, payload) {
      console.log('azureiotcentral/connectionString', payload, this.azureiotcentral.device);
      if (payload.deviceId == this.azureiotcentral.device.deviceId) {
        this.$set(this.azureiotcentral.device, 'connectionString', payload.connectionString);
        this.azureiotcentral.wait = false;
      }
    }.bind(this));
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('azureiotcentral/connectionString');
  },
  computed: {
    azureiotcentralDeviceOptions: function(){
      return this.$store.state.gateway.sensorList.map(sensor=>sensor.id);
    }
  },
  methods: {
    onSubmitUbidots(evt) {
      evt.preventDefault();
      
      if (config_set('ubidots', undefined, this.ubidots)) {
        this.$store.dispatch('add_message_success', 'Successfully saved.');
      } else {
        this.$store.dispatch('add_message_error', 'Chyba při ukládání');
      }

    },
    onSubmitAzureiotcentral(evt) {
      evt.preventDefault();
      if (config_set('azureiotcentral', 'enable', this.azureiotcentral.enable)) {
        this.$store.dispatch('add_message_success', 'Successfully saved.');
      } else {
        this.$store.dispatch('add_message_error', 'Chyba při ukládání');
      }

      config_set('azureiotcentral', 'devices', this.azureiotcentral.devices)
    },
    azureiotcentralDeviceChange () {
      if (this.azureiotcentral.selected) {
        if (this.azureiotcentral.devices[this.azureiotcentral.selected] === undefined) {
          this.azureiotcentral.devices[this.azureiotcentral.selected] = {
            deviceId: "cooper-" + this.azureiotcentral.selected
          };
        }
        this.azureiotcentral.device = this.azureiotcentral.devices[this.azureiotcentral.selected];
      }
    },
    azureiotcentralGetConnectionString() {
      this.azureiotcentral.wait = true;
      ipcRenderer.send('azureiotcentral/connectionString/get', this.azureiotcentral.device);
    }
  }
}
</script>

<style>
.config {
  padding: 10px;
}
</style>