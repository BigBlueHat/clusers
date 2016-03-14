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
      exists: false,
      username: '',
      password: '',
      confirmpass: ''
    },
    admin: {},
    ui: {
      user_created: false
    }
  },
  computed: {
    logged_in: function() {
      return Boolean('name' in this.admin && this.admin.name);
    },
    passwords_match: function() {
      return this.new_user.password === this.new_user.confirmpass;
    },
    form_has_error: function() {
      return Boolean(!this.passwords_match || this.new_users.exists);
    }
  },
  watch: {
    'new_user.username': function() {
      this.new_user.exists = false;
    }
  },
  created: function() {
    var self = this;
    self.$db.getSession(function(err, resp) {
      if (err) {
        // network error
      } else if ('ok' in resp && resp.ok) {
        self.admin = resp.userCtx;
      }
    });
  },
  events: {
    login: function(username, password) {
      var self = this;
      self.$db.login(username, password)
        .then(function(resp) {
          if (resp.ok === true) {
            // TODO: trigger a full GET /_session
            self.admin = {
              name: username
            };
          }
        })
        .catch(console.log.bind(console));
    }
  },
  methods: {
    logout: function() {
      var self = this;
      self.$db.logout(function(err, resp) {
        if (!err) {
          self.admin = {};
        }
      });
    },
    makeUser: function() {
      var self = this;

      self.$db.get('org.couchdb.user:' + self.new_user.username)
        .then(function(user) {
          self.new_user.exists = true;
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
            if (resp.ok) {
              // reset new_user to original data values
              self.new_user = self.$options.data().new_user;
              self.ui.user_created = self.new_user.username;
            }
          })
          .catch(function(err) {
            if (err.status === 409) {
              // user exists, throw error
              self.new_user.exists = true;
            } else {
              console.log(err);
            }
          });
        });
    }
  },
  components: {
    'login-form': require('./login-form')
  }
});
