<template>
  <div id="datasheet">
      <pdf :data="pdfData"></pdf>
  </div>
</template>

<script>
import pdf from '../components/pdf.vue'
import data from './COOPER_RF_Datasheet_1.4'

const pdfData = atob(data);

export default {
  name: 'Datasheet',
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
