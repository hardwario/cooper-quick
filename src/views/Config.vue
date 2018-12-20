<template>
  <div class="config">
    
    <h2>Ubidots</h2>
    
    <b-form inline>
      <label class="mr-sm-2" for="inlineFormCustomSelectPref">Auth-Token</label>

      <b-input class="mb-2 mr-sm-2 mb-sm-0" id="inlineFormInputName2" placeholder="..." type="text" v-model="ubidots_auth_token" />

      <b-button variant="primary" @click="ubidots_auth_token_save">Save</b-button>
    </b-form>

  </div>
</template>

<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'config',
  data () {
    return {
      ubidots_auth_token: ipcRenderer.sendSync('sync/settings/get', 'ubidots_auth_token')
    }
  },
  created() {
  },
  methods: {
    ubidots_auth_token_save() {
      ipcRenderer.send('sync/settings/set', {key:'ubidots_auth_token', value: this.ubidots_auth_token})
    }
  }
}
</script>

<style>
.config {
  padding: 10px;
}
</style>