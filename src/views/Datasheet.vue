<template>
  <div id="datasheet" v-if="src">
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
import data from './COOPER_RF_Datasheet_1.5'

const pdfData = atob(data);

export default {
  name: 'Datasheet',
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
