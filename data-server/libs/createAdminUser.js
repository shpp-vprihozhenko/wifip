/**
 * Created by Uzer on 28.02.2016.
 */
var mysql = require('mysql');

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

createAdmin();
//updateAdminPwd();

con.end();

function createAdmin(id, state) {
    var dataSet = {
      email: "admin",
      pwd: "wifiAdmin"
    };
    con.query('INSERT INTO users SET ?', dataSet, function (err, res) {
      if (err)
        console.log(err);
      else
        console.log('Data added to db', dataSet);
    });
}

function updateAdminPwd(id, state) {
    con.query('UPDATE users SET pwd = ? WHERE email = "admin', ["111"], function (err, result) {
      if (!err) {
        console.log('Error on Update');
      } else {
        console.log("State for " + id + " is updated to " + state);
      }
    })
}
