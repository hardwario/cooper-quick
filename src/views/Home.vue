<template>
  <div id="home" v-if="src">
      <pdf style="width:100%" 
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
			src: null,
      numPages: 0,
      timeout: null
		}
	},
  mounted(){
    this.load();
  },
  methods: {
    load() {
      this.src = pdf.createLoadingTask({data: pdfData});
      this.timeout = setTimeout(()=>{
        this.load();
      }, 2000);
      this.src.then(pdf => {  
        clearTimeout(this.timeout);
        this.numPages = pdf.numPages;
      });
    }
  }
}

</script>
