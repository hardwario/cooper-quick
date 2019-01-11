
<template>
  <div id="app" class="app">

    <b-navbar toggleable="md" type="dark" variant="dark">
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>

      <b-navbar-brand href="#">COOPER Quick</b-navbar-brand>

      <b-collapse is-nav id="nav_collapse">
        <b-navbar-nav>
          <b-nav-item to="/">Home</b-nav-item>
          <b-nav-item to="/dongle">Dongle</b-nav-item>
          <b-nav-item to="/node">Device</b-nav-item>
          <b-nav-item to="/config">Config</b-nav-item>
          <b-nav-item to="/datasheet">Datasheet</b-nav-item>
        </b-navbar-nav>

        <b-navbar-nav class="ml-auto">
          <button class="btn btn-danger" v-if="$store.state.gateway.state == 'connected'" @click="disconnect">Disconnect dongle</button>
        </b-navbar-nav>

      </b-collapse>
    </b-navbar>

    <b-alert variant="danger"
             dismissible
             :show="!!$store.state.error"
             @dismissed="$store.commit('error', null)">
      {{ $store.state.error }}
    </b-alert>

    <router-view/>    
  </div>
</template>

<script>
export default {
  name: 'app',
  created() {
    this.$store.dispatch('gateway_state_get');
    this.$store.dispatch('update_serial_port_list');
  },
  methods: {
    disconnect() {
      this.$store.dispatch('gateway_disconnect');
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
