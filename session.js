const Keyv = require('keyv');
const { Store } = require('express-session');

class KeyvStore extends Store {
  constructor(options) {
    super();
    this.keyv = new Keyv(options.uri, options);
    this.keyv.on('error', err => console.error('Keyv connection error:', err));
  }

  async get(sid, callback) {
    try {
      const data = await this.keyv.get(sid);
      callback(null, data);
    } catch (err) {
      console.error(`Error getting session: ${sid}`, err);
      callback(err);
    }
  }

  async set(sid, session, callback) {
    try {
      await this.keyv.set(sid, session);
      callback(null);
    } catch (err) {
      console.error(`Error setting session: ${sid}`, err);
      callback(err);
    }
  }

  async destroy(sid, callback) {
    try {
      await this.keyv.delete(sid);
      callback(null);
    } catch (err) {
      console.error(`Error destroying session: ${sid}`, err);
      callback(err);
    }
  }
}

module.exports = KeyvStore;
