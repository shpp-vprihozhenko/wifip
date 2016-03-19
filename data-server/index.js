'use strict';

var bunyan        = require('bunyan');

var Server        = require('./libs/tcp');
var config        = require('./libs/config');
var deviceHandler = require('./api/device');

var logger = bunyan.createLogger(config.get('logger'));
var server = new Server({ port: config.get('port') }, logger.child({ component: 'tcp-server' }));

server.addHandler(deviceHandler);

server.listen(function() {
  logger.info('Server is ready');
});
