"use strict";

var net = require('net');
var fs = require('fs');

var jsonfile = require('jsonfile');
var HashService = require('sails-service-hash');

var Model = require('../libs/db');

module.exports = function (data, socket) {
  var findings = data.toString();
  var isLogin = /^login(=)+\w+(&)pass(=)+\w+\n/.test(findings);

  if (isLogin) {
    if (!checkLogin(findings)){
        socket.end("Restricted");
        return false;
    }

    UpdateDevStateInDB(findings, function (err, result) {
      if (err) return err;

      if (result == "OK") {
        socket.write('ok');
        //socket.pipe(socket);
        socket.end();
      }
    });

  } else {
      socket.end("Not valid String\n\r");
      return false;
  }
};

function dateFix(date) {
  if (date < 10) {
    return "0" + date;
  }
  return date;
}

function dateMysqlFormat(date) {
  return date.getFullYear() + "-" + dateFix((date.getMonth() + 1)) + "-" + dateFix(date.getDate()) + " " + dateFix(date.getHours()) + ":" + dateFix(date.getMinutes()) + ":" + dateFix(date.getSeconds());
}

function dateNowInSecond() {
  return Math.round(Date.now() / 1000);
}

function checkLogin(auth, cb) {
  var strSplit = auth.toString().replace(/(\r\n|\n|\r)/gm, "").split('&');
  var authCheck = {};

  for (var i = 0; i < strSplit.length; i++) {

    strSplit[i].split("=").reduce(function (prev, curr, index) {
      authCheck[prev] = curr;
    });

  }
  ;

  Model.getConnection(function (err, connection) {
    if (err) {
      connection.release();
      return;
    }

    connection.setMaxListeners(0);

    connection.query("SELECT password, id FROM device WHERE id_device=?", [authCheck.login], function (err, rows) {
      connection.release();

      if (!err) {
        var bcrypt = HashService('bcrypt', {});

        if (rows.length != 0) {
          var isEqual = bcrypt.compareSync(authCheck.pass, rows[0].password);

          if (isEqual) {

            return cb(null, {logged: true, id: rows[0].id});

          } else {
            return cb({logged: false, msg: "incorrect password\r\n"});
          }

        } else {
          cb({logged: false, msg: 'incorrect login\r\n'});
        }

      }

    });

    connection.on('error', function (err) {
      console.log(err);
    });

  });

}

function insertDataDB(arrkey, arrtime, id, cb) {
  var arrData = [];
  var dateState;
  var arrResult = [];

  for (var i = 0; i < arrkey.length; i++) {
    var obj = {};
    obj['state'] = arrkey[i].key;
    obj['time'] = arrtime[i].time;
    obj['owner_device'] = id;
    arrData.push(obj);
  }
  ;

  for (var i = 0; i < arrData.length; i++) {

    if (arrData[i].state == "0") {

      dateState = dateNowInSecond() - arrData[i].time;

    } else {
      arrResult.push(arrData[i]);
    }
  }
  ;

  arrResult.sort(function (a, b) {
    return a.time - b.time;
  });


  if (arrResult.length > 1) {

    var filterRepetition = arrResult.filter(function (number, i, arr) {
      if (arr.length - 1 != i) {

        if (arr[i].time == arr[i + 1].time) {
          return false;
        } else {
          return true;
        }

      } else {

        if (arr[i].time == arr[i - 1].time) {
          return false;
        } else {
          return true;
        }
      }

    });


    var filterSeconds = filterRepetition.filter(function (item, i, arr) {
      if (arr.length - 1 != i) {

        if (Math.abs(arr[i + 1].time - arr[i].time) < 3) {
          return false;
        } else {
          return true;
        }

      } else {

        return true;
      }
    });

    for (var i = 0; i < filterSeconds.length; i++) {
      filterSeconds[i].time = (dateState + Number(filterSeconds[i].time)) * 1000;

    }
    ;


    for (var i = 0; i < filterSeconds.length; i++) {

      insertDataMysql(filterSeconds[i]);

      if (filterSeconds.length - 1 == i) {

        updateSuccessTransf(id)
        cb(null, "OK");
      }

    }
    ;
  } else {
    if (dateState) {

      arrResult[0].time = (dateState + Number(arrResult[0].time)) * 1000;

      insertDataMysql(arrResult[0]);

      updateSuccessTransf(id);

      cb(null, "OK");

    } else {
      cb("not date state");
    }

  }

}


function insertDataMysql(obj) {
  Model.getConnection(function (err, connection) {
    if (err) {
      connection.release();
      return;
    }

    connection.query("INSERT INTO data SET ?", obj, function (err, rows) {
      connection.release();

      if (!err) {
        return "ok";
      }

    });

    connection.on('error', function (err) {
      console.log(err);
    });

  });
}

function updateSuccessTransf(id) {
  Model.getConnection(function (err, connection) {
    if (err) {
      connection.release();
      return;
    }

    connection.query("UPDATE device SET success_tranfer = ? WHERE id = ?", [Date.now(), id]);

    connection.on('error', function (err) {
      console.log(err);
    });

  });
}
