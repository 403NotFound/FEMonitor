<template>
  <div id="app">
    <img @click="handleClick" alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld v-if="haha" msg="Welcome to Your Vue.js App" />
    <img src="nonexistent.jpg" alt="This image does not exist" />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    HelloWorld,
  },
  data() {
    return {
      haha: true,
    }
  },
  methods: {
    handleClick() {
      console.log(1234)
      // throw new Error('报错啦')
    },
  },
  mounted() {
    throw new Error('报错啦')
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
