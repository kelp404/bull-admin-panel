module.exports = {
  expressServer: {
    host: '0.0.0.0',
    port: '8000',
  },
  bull: {
    redisUrl: 'redis://localhost:6379/0',
  },
};
