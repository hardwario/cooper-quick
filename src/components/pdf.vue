<template>
  <div id="datasheet">
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

export default {
  name: 'Pdf',
  props: ['data'],
  components: {
    pdf
  },
	data() {
		return {
			src: null,
      numPages: 0
		}
	},
  created(){
    this._timeout = null;
    this.loadPdf();
  },
  beforeDestroy(){
    if (this._timeout) clearTimeout(this._timeout);
  },
  methods: {
    loadPdf(){
      if (this._timeout) clearTimeout(this._timeout);
      this._timeout = setTimeout(this.loadPdf, 1500);
      
      this.src = pdf.createLoadingTask({data: this.data});
      this.src.then(pdf => {
        this.numPages = pdf.numPages;
        if (this._timeout) clearTimeout(this._timeout);
      })
      .catch((error) => {console.log('Pdf this.src.catch', error)})
    }
  },
}

</script>
