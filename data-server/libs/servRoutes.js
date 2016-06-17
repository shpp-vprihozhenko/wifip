var async = require('asyncawait/async');
var await = require('asyncawait/await');
var ADM_PWD = "123";

var init = function(app, con, myTcp) {

  function checkUserDevLink(data) {
    return function(cb){
      console.log("check user-device link", data);
      con.query('SELECT user_id FROM userdevices WHERE device_id=?', [data.device_id], function (err, answer) {
        if(err){
          console.log("Error on query to DB", err);
          return cb(err, {code: 500});
        } else {
          if (answer[0].user_id != data.user_id){
            console.log("no link, 403");
            cb(null, {code: 403});
          } else {
            console.log("linked, 200");
            cb(null, {code: 200});
          }
        }
      });
    }
  }

  function checkLogin(data) {
    return function(cb){
      con.query('SELECT pwd,id FROM users WHERE users.email=?', [data.email], function (err, answer) {
        if(err){
          console.log("Error on query to DB", err);
          return cb(err, {code: 500});
        } else {
          if (answer.length == 0) {
            cb (null, {code: 404})
          } else if (answer[0].pwd != data.password){
            cb(null, {code: 403});
          } else {
            cb(null, {code: 200, uid: answer[0].id});
          }
        }
      });
    }
  }

  app.post('/login', function(req, res) {

      function findUserData(data,uid) {
        return function (cb) {
          console.log("findUserData", uid, data);
          if (data.email.toLowerCase() == "admin"){
            con.query('SELECT device_id, device_state, description, user_id FROM userdevices', function (err, answer) {
              if(err){
                console.log("Error on select query to DB", err);
                return cb(null, undefined);
              } else {
                return cb(null, answer);
              }
            });
          } else {
            con.query('SELECT device_id, device_state, description  FROM userdevices WHERE userdevices.user_id=?', [uid],
              function (err, answer) {
                if(err){
                  console.log("Error on select query to DB", err);
                  return cb(null, undefined);
                } else {
                  return cb(null, answer);
                }
              }
            );
          }
        }
      }

      console.log("Incoming login: ", req.body);
      var email=req.body.email;
      var pwd=req.body.pwd;

      var sendAnswer = async(function(){
        var data = {email: email, password: pwd};
        console.log("sendAnsw func: ");
        var result = await(checkLogin(data));
        console.log("sendAnsw func: after checkLogin", result.code);
        res.statusCode = result.code;
        res.setHeader('Access-Control-Allow-Origin', '*');
        console.log("setHeader...");

          if (result.code == 200) {
            var userData = await(findUserData(data, result.uid));
            console.log("sending userdata", userData);
            res.status(200).json({state: "ok", userdata: userData});
          } else {
            res.send();
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

        var asSwitchFunc = async( function () {
          var result = await(checkLogin({email: req.body.email, password: req.body.password}));
          if (result.code != 200) {
            console.log("login checking not passed.");
            res.send (result.code);
            return;
          }

          result = await(checkUserDevLink({user_id: result.uid, device_id: req.body.device_id}));
          res.send (result.code);
          if (result.code != 200) {
            console.log("User-device link checking not passed.");
            return;
          }

          var cmd = req.body.command == 1 ? "status=on" : "status=off";
          var cmdPos = myTcp.arDevCmdId.indexOf(req.body.device_id);

          if(cmdPos==-1){
            console.log("pushing cmd "+cmd+" for "+req.body.device_id);
            myTcp.arDevCmd.push(cmd);
            myTcp.arDevCmdId.push(req.body.device_id);
          } else {
            console.log("device "+req.body.device_id+" already has command in queue. Try updating.");
            if (myTcp.arDevCmd[cmdPos]==cmd) {
              console.log ("command equal to previous, ignored");
            } else {
              console.log ("command updated to "+cmd);
              myTcp.arDevCmd[cmdPos]=cmd;
            }
          }
        });
        asSwitchFunc();
    });

  app.post('/check_devId', function(req, res) {
    console.log("Incoming check_devId request: ", req.body);
    if (!req.body.deviceId) {
      res.send (404);
    } else {
      con.query('SELECT device_state, description FROM userdevices WHERE userdevices.device_id=?', [req.body.deviceId],
        function (err, answer) {
          console.log("answer", answer);
          if (answer.length==0) {
            res.statusCode = 404;
          } else {
            res.statusCode = 200;
          }
          res.send();
        }
      );
    }
  });

  app.post('/reg_new_user', function(req, res) {
    console.log("Incoming reg_new_user request: ", req.body);

    if (!req.body.deviceId) {
      res.send (404);
    } else {

      // check dev_id!
      con.query('SELECT user_id FROM userdevices WHERE userdevices.device_id=?', [req.body.deviceId],
        function (err, answer) {
          console.log("answer", answer);
          if (answer.length==0) {
            res.statusCode = 404;
          } else {
            if (answer[0].user_id != 0) { // dev already registred to somebody else
              res.statusCode = 403;
            } else {
              res.statusCode = 200;

              var regNewUserAndUpdateDeviceLink = async( function() {
                var uid = await (regNewUser(req.body.email, req.body.password));
                //var await (findUserId(req.body.email));
                console.log("added user id", uid);
                await (updateDevLink(req.body.deviceId, uid));
              });

              regNewUserAndUpdateDeviceLink ();
            }
          }
          res.send();
        }
      );
    }

    function regNewUser(email, password) {
      return function (cb) {
        console.log("reg new u ", email, password);
        var dataSet = {
          email: req.body.email,
          pwd: req.body.password
        };
        con.query('INSERT INTO users SET ?', dataSet, function (err, res) {
          if (err) {
            console.log(err);
            cb(err, null);
          } else {
            console.log('Data added to db', dataSet, res.insertId);
            cb(null, res.insertId);
          }
        });
      }
    }
    function updateDevLink(devId, userId) {
      return function (cb) {
        console.log("updateDevLink", devId, userId);
        con.query('UPDATE userdevices SET user_id = ? WHERE device_id = ?', [userId, devId], function (err, res) {
          if (err) {
            console.log(err);
            cb(err, null);
          } else {
            console.log('Data updated', res);
            cb(null, res);
          }
        });
      }
    }

  });

  app.post('/users_data', function(req, res) {
    console.log("Incoming users_data request: ", req.body);
    if (!(req.body.email=="admin") && (req.body.password==ADM_PWD)) {
      res.send (403);
    } else {
      con.query('SELECT id, email FROM users',
        function (err, answer) {
          console.log("answer", answer);
          res.json(answer);
        }
      );
    }
  });

  app.post('/update_users_data', function(req, res) {
    console.log("Incoming update_users_data request: ", req.body);
    if (!(req.body.email == "admin") && (req.body.password == ADM_PWD)) {
      res.send(403);
    } else {
      if (req.body.mode == 1) {
        con.query('UPDATE users SET email = ? WHERE id = ?', [req.body.change_email, req.body.change_id], function (err, result) {
          console.log("updating results", err, result);
          if (err) {
            console.log('Error on Update');
            res.send(500);
          } else {
            console.log('ok on update');
            res.send(200);
          }
        });
      } else if (req.body.mode == 2) {
        var dataSet = {email: req.body.change_email, pwd: "1"};
        con.query('INSERT INTO users SET ?', dataSet, function (err, result) {
          console.log("adding results", err, result);
          if (err) {
            console.log('Error on Add');
            res.send(500);
          } else {
            console.log('ok on add');
            res.send(200);
          }
        });
      } else if (req.body.mode == 3) {
        con.query('delete from users where id=?', req.body.change_id, function (err, result) {
          console.log("deleting results", err, result);
          if (err) {
            console.log('Error on del');
            res.send(500);
          } else {
            console.log('ok on del');
            res.send(200);
          }
        });
      } else if (req.body.mode == 4) {
        con.query('UPDATE users SET pwd = ? WHERE id = ?', [req.body.newPwd, req.body.change_id], function (err, result) {
          console.log("updating results", err, result);
          if (err) {
            console.log('Error on pwd reset');
            res.send(500);
          } else {
            console.log('ok on pwd reset');
            res.send(200);
          }
        });
      } else {
        res.send(500);
      }
    }
  });

  app.post('/update_dev_data', function(req, res) {
    console.log("Incoming update_dev_data request: ", req.body);
    if (!(req.body.email == "admin") && (req.body.password == ADM_PWD)) {
      res.send(403);
    } else {
      var value = "", updtField = "";
      if (req.body.newUid) {
        console.log("setting new user id for device");
        updtField = "user_id";
        value = req.body.newUid;
      } else {
        if (req.body.newDescription) {
          console.log("setting new description for device");
          updtField = "description";
          value = req.body.newDescription;
        }
      }
      con.query('UPDATE userdevices SET '+updtField+'=? WHERE device_id=?', [value, req.body.device_id], function (err, result) {
        console.log("updating results", err, result);
        if (err) {
          console.log('Error on Update');
          res.send(500);
        } else {
          console.log('ok on update');
          res.send(200);
        }
      });
    }
  });

};

module.exports = {
    init: init
};
