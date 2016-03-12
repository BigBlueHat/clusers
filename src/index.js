var Vue = require('vue');
Vue.use(require('vue-pouchdb'), {name: location.origin + '/_users'});

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
    new_user: {
      username: '',
      password: '',
      confirmpass: ''
    },
    logged_in: false
  },
  computed: {
    passwords_match: function() {
      return this.new_user.password === this.new_user.confirmpass;
    }
  },
  methods: {
    makeUser: function() {
      var self = this;
      var admin = self.$refs.loginForm;
      self.$db.login(admin.username, admin.password)
        .then(function(resp) {
          if (resp.ok) {
            self.logged_in = true;
          }
        })
        .catch(console.log.bind(console));

      self.$db.get('org.couchdb.user:' + self.new_user.username)
        .then(function(user) {
          console.log('user exists', user);
        })
        .catch(function(err) {
          var hashAndSalt = generatePasswordHash(self.new_user.password);
          self.$db.put({
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
  },
  components: {
    'login-form': require('./login-form')
  }
});
