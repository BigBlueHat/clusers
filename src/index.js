var Vue = require('vue');
var PouchDB = require('pouchdb');

var crypto = require('crypto');

function generatePasswordHash(password) {
  var salt = crypto.randomBytes(16).toString('hex');
  var hash = crypto.createHash('sha1');
  hash.update(password + salt);
  return [hash.digest('hex'), salt];
}

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

      db.get('org.couchdb.user:' + self.new_user.username)
        .then(function(user) {
          console.log('user exists', user);
        })
        .catch(function(err) {
          var hashAndSalt = generatePasswordHash(self.new_user.password);
          db.put({
            _id: 'org.couchdb.user:' + self.new_user.username,
            name: self.new_user.username,
            roles: [],
            password_sha: hashAndSalt[0],
            salt: hashAndSalt[1],
            password_scheme: 'simple',
            type: 'user'
          })
          .then(function(resp) {
            console.log('new user', resp);
          })
          .catch(console.log.bind(console));
        });
    }
  }
});
