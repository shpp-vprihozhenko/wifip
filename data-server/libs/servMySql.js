var mysql = require("mysql");
var config = require("../myConfig.json");

var init = function (cb) {
    this.con = mysql.createConnection({
        host: config.sql_host,
        user: config.sql_user,
        password: config.sql_password,
        database: config.sql_database
    });
    this.con.connect(function (err) {
        if (err) {
            console.log('Error connecting to Db.');
            cb (false);
        }
        console.log('Connection to DB established');
        cb (true);
    });
};

module.exports = {
    init: init
};
