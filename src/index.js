var Vue = require('vue');

var cluser = new Vue({
  el: '#user-maker',
  data: {
    username: '',
    password: '',
    confirmpass: '',
    email: ''
  },
  computed: {
    passwords_match: function() {
      return this.password === this.confirmpass;
    }
  }
});
