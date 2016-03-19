/**
 * Created by Uzer on 27.02.2016.
 */
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var express = require('express');

var mysql = require("mysql");
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "qwe123",
  database: "wifipilot"
});

con.connect(function (err) {
  if (err) {
    console.log('Error connecting to Db.');
    return;
  }
  console.log('Connection to DB established');
});

var PORT = 6616;

var net = require("net");

net.createServer(function (socket) {
  var msg = "Incoming connetion established with " + socket.remoteAddress + ":" + socket.remotePort;
  console.log(msg);

  socket.on("data", function (data) {
    var logMsg = " from " + this.remoteAddress + ':' + this.remotePort + ' received msg: \"' + data + '\"';
    console.log("msg " + logMsg);
    socket.write("ok");
    socket.end();

    data=""+data;

    var data_ar=data.split("&");
    var data_obj={};
    for(var i=0; i<data_ar.length; i++){
      var rec=data_ar[i].split("=");
      data_obj[rec[0]]=rec[1];
    }
    console.log("Incoming data decoded to:", data_obj);

    changeDevState(data_obj);
  });

  socket.on("close", function () {
    console.log("connection closed");
  });

}).listen(PORT);
console.log("Listening tcp port", PORT);

var updateDevState = async(function (id, state) {

  function checkExistId(id) {
    return function(cb){
      var res=false;
      con.query('SELECT COUNT(*) as numRecords FROM userdevices WHERE device_id=?', [id], function (err, answer) {
        if (err) {
          console.log(err);
        } else {
          if (answer[0].numRecords > 0){
            res=true;
            console.log("such ID is present in DB");
          }
        }
        return cb (null, res);
      });
    }}

  function createId(id, state) {
    return function(cb){
      var dataSet = {
        user_id: 0,
        device_id: id,
        device_state: state
      };
      con.query('INSERT INTO userdevices SET ?', dataSet, function (err, res) {
        if (err) {
          console.log(err);
        } else {
          console.log('Data added to db', dataSet);
        }
        cb();
      });
    }}

  function updateId(id, state) {
    return function(cb){
      con.query('UPDATE userdevices SET device_state = ? WHERE device_id = ?', [state, id], function (err, result) {
        if (err) {
          console.log('Error on Update');
        } else {
          console.log("State for " + id + " is updated to " + state);
        }
        cb();
      })
    }}

  var fIdExist = await(checkExistId(id));
  if (fIdExist) {
    console.log("updating state for " + id);
    await(updateId(id, state));
  } else {
    console.log("create new record for " + id);
    await(createId(id, state));
  }
});

function changeDevState(dataObj) {
  var id = dataObj.id;
  if (!id) {
    console.log("Id is invalid, rejection");
    return;
  }
  var state = dataObj.status;
  if (state=='off') {
    state = 0;
  } else {
    state = 1;
  }
  updateDevState(id, state);
}

var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/', function(req, res){
  res.sendfile('index.html');
});

function checkLogin(data) {
  return function(cb){
    con.query('SELECT pwd,id FROM users WHERE users.email=?', [data.email], function (err, answer) {
      if(err){
        console.log("Error on query to DB", err);
        return cb(null, undefined);
      } else {
        if (answer.length==0 || answer[0].pwd != data.pwd){
          return cb(null, {res: false});
        } else {
          return cb(null, {res: true, uid: answer[0].id});
        }
      }
    });
  }
}

app.post('/login', function(req, res) {

  function findUserData(data,uid) {
    return function (cb) {
      if(data.email=="admin"){
        con.query('SELECT device_id, device_state, description FROM userdevices', function (err, answer) {
          if(err){
            console.log("Error on select query to DB", err);
            return cb(null, undefined);
          } else {
            return cb(null, answer);
          }
        });
      } else {
        con.query('SELECT device_id, device_state, description  FROM userdevices WHERE userdevices.user_id=?', [uid], function (err, answer) {
          if(err){
            console.log("Error on select query to DB", err);
            return cb(null, undefined);
          } else {
            if (answer.length==0 || answer[0].pwd != data.pwd){
              return cb(null, false);
            } else {
              return cb(null, true);
            }
          }
        });
      }
    }
  }

  var data=JSON.parse(req.body.data);
  console.log("Incoming login: ", data);

  var sendAnswer=async(function(){
    var result = await(checkLogin(data));
    if (result==undefined){
      res.statusCode = 500;
      res.json({state: "Error on query to DB"});
    } else {
      if (result.res==false) {
        res.statusCode = 200;
        res.statusMessage = 'wrong password';
        res.setHeader('Content-Type', 'application/json');
        res.json({state: "wrong password"});
      } else {
        res.statusCode = 200;
        var userData = await(findUserData(data, result.uid));
        res.json({state: "ok", userdata: userData});
      }
    }
  });
  sendAnswer();
});

app.post('/updtdescr', function(req, res) {

  var data={id: req.body.id, descr: req.body.descr};
  console.log("Incoming update description request: ", data);

  var sendAnswer=async(function(){
    var result = await (updtDescr (data));
    if (result==true) {
      res.statusCode = 200;
      res.statusMessage = 'data updated';
    } else {
      res.statusCode = 500;
      res.statusMessage = 'data not updated';
    }
    res.setHeader('Content-Type', 'application/json');
    res.json({state: result});
  });
  sendAnswer();
});

app.post('/switch', function(req, res) {

  console.log("Incoming switch request: ", req.body);


  res.statusCode = 200;
  res.statusMessage = 'switch request send to device';

  res.setHeader('Content-Type', 'application/json');
  res.json({state: result});

});

var port=6617;
app.listen(port);//process.env.PORT
console.log("Listening http port: "+port);

/*

 sending answer wol=on&00:1d:60:20:c1:9b
 connection closed
 Incoming connetion established with ::ffff:195.149.108.51:30353
 msg  from ::ffff:195.149.108.51:30353 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&status=off
 "
 sending answer wol=on&00:1d:60:20:c1:9b
 Incoming connetion established with ::ffff:195.149.108.51:21868
 msg  from ::ffff:195.149.108.51:21868 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&wol=ok
 "
 sending answer wol=on&00:1d:60:20:c1:9b
 connection closed
 connection closed
 Incoming connetion established with ::ffff:195.149.108.51:33140
 msg  from ::ffff:195.149.108.51:33140 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&status=off
 "
 sending answer wol=on&00:1d:60:20:c1:9b
 Incoming connetion established with ::ffff:195.149.108.51:24404
 msg  from ::ffff:195.149.108.51:24404 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&wol=ok
 "
 sending answer wol=on&00:1d:60:20:c1:9b
 connection closed
 connection closed
 Incoming connetion established with ::ffff:195.149.108.51:10537
 msg  from ::ffff:195.149.108.51:10537 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&alarm=ok
 "
 sending answer something
 connection closed
 Incoming connetion established with ::ffff:195.149.108.51:7854
 msg  from ::ffff:195.149.108.51:7854 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&status=on
 "
 sending answer something
 connection closed
 Incoming connetion established with ::ffff:195.149.108.51:7879
 msg  from ::ffff:195.149.108.51:7879 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&status=on
 "
 sending answer something
 connection closed

 ^C
 ubuntu@ip-172-31-44-14:~/server$ node serv2.js
 Incoming connetion established with ::ffff:195.149.108.51:7882
 msg  from ::ffff:195.149.108.51:7882 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&status=on
 "
 sending answer wol=on&00:1d:60:20:c1:9b
 connection closed
 Incoming connetion established with ::ffff:195.149.108.51:30353
 msg  from ::ffff:195.149.108.51:30353 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&status=off
 "
 sending answer wol=on&00:1d:60:20:c1:9b
 Incoming connetion established with ::ffff:195.149.108.51:21868
 msg  from ::ffff:195.149.108.51:21868 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&wol=ok
 "
 sending answer wol=on&00:1d:60:20:c1:9b
 connection closed
 connection closed
 Incoming connetion established with ::ffff:195.149.108.51:33140
 msg  from ::ffff:195.149.108.51:33140 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&status=off
 "
 sending answer wol=on&00:1d:60:20:c1:9b
 Incoming connetion established with ::ffff:195.149.108.51:24404
 msg  from ::ffff:195.149.108.51:24404 recieved msg: "id=pw5ccf7f059304&login=opinionbutton.shpp&pass=idtest&wol=ok

 */
