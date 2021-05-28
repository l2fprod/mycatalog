<template>
  <prism-editor class="my-editor" v-model="code" :highlight="highlighter" readonly language="language"></prism-editor>
</template>

<script>
  import '@/assets/markup.css';

  // import Prism Editor
  import { PrismEditor } from 'vue-prism-editor';
  import 'vue-prism-editor/dist/prismeditor.min.css'; // import the styles somewhere

  // import highlighting library (you can use any library you want just return html string)
  import { highlight, languages } from 'prismjs/components/prism-core';
  import 'prismjs/components/prism-hcl';
  import 'prismjs/components/prism-bash';

  export default {
    props: [
      'code',
      'language',
    ],
    components: {
      PrismEditor,
    },
    methods: {
      highlighter(code) {
        return highlight(code, {
          ...languages[this.language],
        });
      },
    },
  };
</script>

<style>
  /* required class */
  .my-editor {
    /* we dont use `language-` classes anymore so thats why we need to add background and text color manually */
    /* background: #fff5de; */
    /* color: #ccc; */

    /* you must provide font-family font-size line-height. Example: */
    /* font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace; */
    /* font-size: 10px; */
    /* line-height: 1.5; */
    /* padding: 10px; */

  background-color: #fafafa;
  max-height: 400px;
  font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 5px 10px;
  }

  /* optional class for removing the outline */
  .prism-editor__textarea:focus {
    outline: none;
  }
</style>