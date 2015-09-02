module.exports = {
  serialize: function(value) {
    return 'prefix' + value;
  },
  deserialize: function(value) {
    return value ? value.replace(/^prefix/, '') : value;
  },
  get: function(key) {
    return this.deserialize(localStorage.getItem(key));
  },
  set: function(key, value) {
    localStorage.setItem(key, this.serialize(value));
  },
  unset: function(key) {
    localStorage.removeItem(key);
  }
};
