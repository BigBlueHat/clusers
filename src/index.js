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
  },
  methods: {
    makeUser: function() {
      var self = this;
      var db = new PouchDB(location.origin + '/_users', {
        auth: {
          username: self.admin.username,
          password: self.admin.password
        }
      })

      db.installUsersBehavior()
        .then(function () {
          return db.put({
            _id: 'org.couchdb.user:' + self.new_user.username,
            type: 'user',
            name: self.new_user.username,
            roles: [],
            password: self.new_user.password
          })
        })
        .then(function(resp) {
          console.log('new user', resp);
        })
        .catch(console.log.bind(console));
    }
  }
});
