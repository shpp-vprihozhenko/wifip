'use strict';

var net = require('net');

module.exports = Server;

function Server(options, logger) {
  this._logger = logger;
  this._options = options;
  this._server = net.createServer();
}

Server.prototype.listen = function(cb) {
  var _this = this;
  var port = _this._options.port || 2000;

  this._server.listen(port, function() {
    _this._logger.debug('Opened server on', _this._server.address());

    _this._server.on('connection', function(socket) {
      _this._logger.debug('Client connected', socket.address());

      socket.on('error', function(err) {
        _this._logger.error(err);
      });

      socket.once('close', function() {
        _this._logger.debug('Closed connection', socket.address());
      });
    });

    cb && cb();
  });
};

Server.prototype.close = function(cb) {
  var _this = this;
  this._server.close(function() {
    _this._logger.debug('Server is finally closed');
    cb && cb();
  });
};

Server.prototype.addHandler = function(handler) {
  this._server.on('connection', function(socket) {
    socket.on('data', function(data) {
      handler(data, socket);
    });
  });
};
