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
var arDevCmdId=[], arDevCmd=[];

net.createServer(function (socket) {
  var msg = "Incoming connetion established with " + socket.remoteAddress + ":" + socket.remotePort;
  console.log(msg);

  socket.on("data", function (data) {
    var logMsg = " from " + this.remoteAddress + ':' + this.remotePort + ' received msg: \"' + data + '\"';
    console.log("msg " + logMsg);

    data=""+data;
    data.replace("\n","");
    data.replace(new RegExp('\r?\n','g'),"");

    var data_ar=data.split("&");
    var data_obj={};
    for(var i=0; i<data_ar.length; i++){
      var rec=data_ar[i].split("=");
      data_obj[rec[0]]=rec[1];
    }

    console.log("Incoming data decoded to:", data_obj);

    var cmdPos = arDevCmdId.indexOf(data_obj.id);
    if (cmdPos > -1){
      if(data_obj.key){ // set new status & annulate previous command
        socket.write("key="+data_obj.key);
        console.log("writing to socket: '"+"key="+data_obj.key+"'");
        arDevCmd.splice(cmdPos, 1);
        arDevCmdId.splice(cmdPos, 1);
        data_obj.status = data_obj.key;
        console.log("Key command received for", data_obj.id, "Remove last command. Status set to", data_obj.status);
      } else {
        socket.write(arDevCmd[cmdPos]);
        console.log("Sending command "+arDevCmd[cmdPos]+" for", data_obj.id);
        arDevCmd.splice(cmdPos, 1);
        arDevCmdId.splice(cmdPos, 1)
      }
    } else {
      if (data_obj.key) {
        data_obj.status = data_obj.key;
        console.log("Key command received for", data_obj.id, "Status set to", data_obj.status);
      }
      socket.write("ok");
    }
    socket.end();

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
  if (state){
    console.log("state updating");
    if (state.substr(0,3)=='off') {
      state = 0;
    } else {
      state = 1;
    }
    updateDevState(id, state);
  } else {
    console.log("Error. No state in tcp packet. Ignored.");
  }
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

  function updtDescr(id, descr) {
    return function(cb){
      con.query('UPDATE userdevices SET description = ? WHERE device_id = ?', [descr, id], function (err, result) {
        if (err) {
          console.log('Error on Update Descr');
        } else {
          console.log("Description for " + id + " is updated to " + descr);
        }
        cb();
      })
    }}

  console.log("Incoming update description request:", req.body);

  var sendAnswer=async(function(){
    var result = await (updtDescr (req.body.id, req.body.descr));
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

  var cmd = (req.body.curState=="-") ? "status=on" : "status=off";
  var cmdPos=arDevCmdId.indexOf(req.body.id);

  if(cmdPos==-1){
    console.log("pushing cmd "+cmd+" for "+req.body.id);
    arDevCmd.push(cmd);
    arDevCmdId.push(req.body.id);
  } else {
    console.log("device "+req.body.id+" already has command in queue. Try updating.");
    if (arDevCmd[cmdPos]==cmd) {
      console.log ("command equal to previous, ignored");
    } else {
      console.log ("command updated to "+cmd);
      arDevCmd[cmdPos]=cmd;
    }
  }

  res.statusCode = 200;
  res.statusMessage = 'switch request send to device';

  res.setHeader('Content-Type', 'application/json');
  res.json({state: "ok"});

});

var port=6617;
app.listen(port);//process.env.PORT
console.log("Listening http port: "+port);
