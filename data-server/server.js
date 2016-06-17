//var async = require('asyncawait/async');
//var await = require('asyncawait/await');
var express = require('express');
var config = require("./myConfig.json");

var mySql = require("./libs/servMySql.js");
var myTcp = require("./libs/servTcp.js");
var myRoutes = require("./libs/servRoutes.js");

mySql.init( function(res) {
  if (!res) {
    console.log("exit on db init error");
    process.exit(1);
  }
});

myTcp.init(mySql.con);

var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));
//app.get('/', function(req, res){
//  res.sendfile('index.html');
//});

myRoutes.init(app, mySql.con, myTcp);

var port=config.httpPort; //6617;
app.listen(port); // || process.env.PORT
console.log("Listening http port: "+port);
