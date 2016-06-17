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

  con.query('DELETE from users where (users.id > 0 and users.id < 6)', function (err, res) {
    if (err)
      console.log(err);
    else
      console.log('Data deleted', res);
  });

});

