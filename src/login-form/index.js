module.exports = {
  template: require('./index.html'),
  data: function() {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    login: function() {
      this.$dispatch('login', this.username, this.password);
    }
  }
};
