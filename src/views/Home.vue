<template>
  <div id="home">
      <pdf
        v-for="i in numPages"
        :src='src'
        :key="i"
        :page="i"
      ></pdf>
  </div>
</template>

<script>
import pdf from 'vue-pdf'
import data from './HARDWARIO_COOPER'

const pdfData = atob(data);

export default {
  name: 'Home',
  components: {
    pdf
  },
	data() {
		return {
			src: pdf.createLoadingTask({data: pdfData}),
      numPages: 0
		}
	},
  created() {
    console.log('created');
    this.src.then(pdf => {  
			this.numPages = pdf.numPages;
      console.log('this.src.then', pdf.numPages)
		})
    .catch((error) => {console.log('this.src.catch', error)})
  },
  methods: {
    nnn(data) {
      console.log('nnn', data)
    },
    eee(data) {
      console.log('eee', data)
    }
  }
}

</script>
