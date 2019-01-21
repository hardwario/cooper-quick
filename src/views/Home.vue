<template>
  <div id="home">
      <pdf :data="pdfData"></pdf>
  </div>
</template>

<script>
import pdf from '../components/pdf.vue'

import data from './HARDWARIO_COOPER'
const pdfData = atob(data);

export default {
  name: 'Home',
  components: {
    pdf
  },
	data() {
		return {
			pdfData: pdfData
		}
	}
}

</script>
