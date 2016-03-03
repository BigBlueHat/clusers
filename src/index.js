var Vue = require('vue');
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-users'));

var cluser = new Vue({
  el: '#user-maker',
  data: {
    admin: {
      username: '',
      password: ''
    },
    new_user: {
      username: '',
      password: '',
      confirmpass: '',
      email: ''
    }
  },
  computed: {
    passwords_match: function() {
      return this.new_user.password === this.new_user.confirmpass;
    }
  }
});
