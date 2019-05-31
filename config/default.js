module.exports = {
  expressServer: {
    host: '0.0.0.0',
    port: '8000'
  },
  kue: {
    prefix: '',
    redis: {
      host: 'localhost',
      port: 6379,
      auth: '',
      db: 1
    }
  }
};
