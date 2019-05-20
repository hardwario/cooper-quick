
<template>
<div id="app">

<!--
    <b-navbar toggleable="md" type="dark" variant="dark" fixed="top">
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>

      <b-navbar-brand href="#">COOPER Quick</b-navbar-brand>

      <b-collapse is-nav id="nav_collapse">
        <b-navbar-nav>
          <b-nav-item to="/">Home</b-nav-item>
          <b-nav-item to="/dongle">Dongle</b-nav-item>
          <b-nav-item to="/sensor">Device</b-nav-item>
          <b-nav-item to="/config">Config</b-nav-item>
          <b-nav-item to="/datasheet">Datasheet</b-nav-item>
        </b-navbar-nav>

        <b-navbar-nav class="ml-auto">
          <button class="btn btn-danger" v-if="$store.state.gateway.state == 'connected'" @click="disconnect">Disconnect dongle</button>
        </b-navbar-nav>

      </b-collapse>
    </b-navbar>
-->

  <div  class="app container-fluid">
    <div class="row">
    
      <nav class="d-md-block sidebar">
        <div class="sidebar-sticky">
          <b-nav vertical pills >
            <b-nav-item to="/home">Home</b-nav-item>
            <b-nav-item to="/dongle">Dongle</b-nav-item>
            <b-nav-item to="/sensor">Sensor</b-nav-item>
            <b-nav-item to="/connectors">Cloud</b-nav-item>
            <b-nav-item to="/datasheet">Datasheet</b-nav-item>
          </b-nav>
        </div>
        {{$store.state.messages.length}}
      </nav>

      <main role="main" class="">

        <b-alert variant="danger"
          dismissible
          :show="!!$store.state.error"
          @dismissed="$store.commit('error', null)">
            {{ $store.state.error }}
        </b-alert>
        
        <div v-for="message in $store.state.messages" >
          <b-alert :variant="message.type" @dismissed="removeMessage" dismissible :show="message.show">
              {{ message.msg }}
          </b-alert>        
        </div>

        <router-view/>    
      </main>

    </div>
  </div>
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
    },
    removeMessage(evt, a, b) {
      console.log(evt, a, b)
    }
  }
}
</script>

<style>
body {
  font-size: .875rem;
}

.feather {
  width: 16px;
  height: 16px;
  vertical-align: text-bottom;
}

/*
 * Sidebar
 */

.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 100; /* Behind the navbar */
  padding: 0px 0 0; /* Height of navbar */
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, .1);
  min-width: 120px;
  background-color: #ddd;
}

.sidebar-sticky {
  position: relative;
  top: 0;
  height: calc(100vh - 0px);
  padding-top: .5rem;
  overflow-x: hidden;
  overflow-y: auto; /* Scrollable contents if viewport is shorter than content. */
}

@supports ((position: -webkit-sticky) or (position: sticky)) {
  .sidebar-sticky {
    position: -webkit-sticky;
    position: sticky;
  }
}

.sidebar .nav-link {
  font-weight: 500;
  color: #333;

}

.sidebar .nav-link .feather {
  margin-right: 4px;
  color: #999;
}

.sidebar .nav-item a {
  -webkit-border-radius: 0;
  -moz-border-radius: 0;
  border-radius: 0;
}

.sidebar .sidebar-sticky .nav-link.active {
  background-color: #0e788a;
  color: white;
}

.sidebar .sidebar-sticky a.nav-link:hover {
    background-color: #fdc700;
    text-decoration: none;
}

.sidebar .nav-link:hover .feather,
.sidebar .nav-link.active .feather {
  color: inherit;
}

.sidebar-heading {
  font-size: .75rem;
  text-transform: uppercase;
}

/*
 * Content
 */

[role="main"] {
  padding-top: 0px; /* Space for fixed navbar */
  margin-left: 120px;
  width: 100%;
}

@media (min-width: 768px) {
  [role="main"] {
    padding-top: 0px; /* Space for fixed navbar */
  }
}

/*
 * Navbar
 */

.navbar-brand {
  padding-top: .75rem;
  padding-bottom: .75rem;
  font-size: 1rem;
  background-color: rgba(0, 0, 0, .25);
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, .25);
}

.navbar .form-control {
  padding: .75rem 1rem;
  border-width: 0;
  border-radius: 0;
}

.form-control-dark {
  color: #fff;
  background-color: rgba(255, 255, 255, .1);
  border-color: rgba(255, 255, 255, .1);
}

.form-control-dark:focus {
  border-color: transparent;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, .25);
}
</style>
