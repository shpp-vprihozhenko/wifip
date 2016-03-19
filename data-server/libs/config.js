'use strict';

var convict = require('convict');

var conf = convict({
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  ip: {
    doc: 'The IP address to bind.',
    format: 'ipaddress',
    default: '127.0.0.1',
    env: 'IP_ADDRESS'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 6616,
    env: 'PORT'
  },
  logger: {
    name: {
      doc: 'The service name.',
      default: 'tcp-statistic-server',
      env: 'LOGGER_NAME'
    },
    level: {
      doc: 'The log level.',
      default: 'error',
      env: 'LOGGER_LEVEL'
    }
  },
  db: {
    connectionLimit: {
      default: 150,
      env: 'DB_CONNECTION_LIMIT'
    },
    host: {
      default: 'localhost',
      env: 'DB_HOST'
    },
    user: {
      default: 'root',
      env: 'DB_USER'
    },
    password: {
      default: '123',
      env: 'DB_PASSWORD'
    },
    database: {
      default: "test",
      env: 'DB_DATABASE'
    },
    charset: {
      default: 'utf8_general_ci',
      env: 'DB_CHARSET'
    },
    debug: {
      default: false,
      env: 'DB_DEBUG'
    }
  }
});

// Load environment dependent configuration
var env = conf.get('env');
conf.loadFile(__dirname + '/../config/' + env + '.json');

// Perform validation
conf.validate({ strict: true });

module.exports = {
  get: conf.get.bind(conf)
};
