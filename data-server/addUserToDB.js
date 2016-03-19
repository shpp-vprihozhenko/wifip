/**
 * Created by Uzer on 16.03.2016.
 */
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

  var dataSet = {
    email : "ttt@ttt.tt",
    pwd   : "123"
  };

  con.query('INSERT INTO users SET ?', dataSet, function (err, res) {
    if (err)
      console.log(err);
    else
      console.log('Data added to db', dataSet);
  });

});

