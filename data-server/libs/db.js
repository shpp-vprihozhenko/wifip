var mysql  = require('mysql');
var config = require('./config');

var pool = mysql.createPool(config.get('db'));

module.exports = pool;
