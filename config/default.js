module.exports = {
  expressServer: {
    host: '0.0.0.0',
    port: '8000',
  },
  bull: {
    redis: {
      host: 'localhost',
      port: 6379,
      db: 1,
    },
  },
};
