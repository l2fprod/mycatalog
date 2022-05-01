<template>
  <app-code
    class="my-0"
    v-bind="$attrs"
  >
    <prism
      ref="code"
      :code="code"
      :inline="inline"
      :language="language"
    />
  </app-code>
</template>

<script>
  // Imports
  import 'markdown-it-prism'
  import 'prismjs/themes/prism.css'
  import 'prismjs/components/prism-bash'
  import 'prismjs/components/prism-hcl'

// Components
  import Prism from 'vue-prism-component'
  import AppCode from './Code'

  export default {
    name: 'MarkupView',
    components: { Prism, AppCode },
    props: {
      code: String,
      inline: Boolean,
      language: String,
    },
  }
</script>
