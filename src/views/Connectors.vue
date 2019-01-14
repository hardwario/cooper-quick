<template>
  <div class="config">

   <h2>Azure IOT Central</h2>
    
    <b-form @submit="onSubmitAzureiotcentral">
      <b-form-group id="azureiotcentralChecks">
          <b-form-checkbox v-model="azureiotcentral.enable">Enable</b-form-checkbox>
      </b-form-group>

      <b-form-group label-for="azureiotcentralInputScopeID"
                    label="Scope ID:">
        <b-form-input id="azureiotcentralInputScopeID"
                      type="text"
                      v-model="azureiotcentral.device.scopeId"
                      required
                      placeholder="...">
        </b-form-input>
      </b-form-group>

      <b-form-group label-for="azureiotcentralInputDeviceId"
                    label="Device ID:">
        <b-form-input id="azureiotcentralInputDeviceId"
                      type="text"
                      v-model="azureiotcentral.device.deviceId"
                      required
                      placeholder="...">
        </b-form-input>
      </b-form-group>

      <b-form-group label-for="azureiotcentralInputPrimaryKey"
                    label="Primary Key:">
        <b-form-input id="azureiotcentralInputPrimaryKey"
                      type="text"
                      v-model="azureiotcentral.device.primaryKey"
                      required
                      placeholder="...">
        </b-form-input>
      </b-form-group>

        <b-form-group label-for="azureiotcentralInputConnectionString"
                    label="Connection String:">
        <b-form-input id="azureiotcentralInputConnectionString"
                      type="text"
                      v-model="azureiotcentral.device.connectionString"
                      required
                      placeholder="...">
        </b-form-input>
      </b-form-group>

      <b-button type="submit" variant="primary">Submit</b-button>
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

      <b-button type="submit" variant="primary">Submit</b-button>
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
        device: config_get('azureiotcentral', 'device')
      }
    }
  },
  created() {
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

      config_set('azureiotcentral', 'device', this.azureiotcentral.device)
    }
  }
}
</script>

<style>
.config {
  padding: 10px;
}
</style>