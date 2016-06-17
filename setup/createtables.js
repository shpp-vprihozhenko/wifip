var mysql      = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "qwe123",
    database: "wifipilot"
});

console.log("con.query('SHOW TABLES'");
// don't need .connect()
con.query('SHOW TABLES', function(err, result){
    if(err) {
        console.log("err", err);
    } else {
        console.log("res of show tables", result);
        result.forEach(function(res){
            console.log("is tbl", res["Tables_in_wifipilot"]);
        });
        nextStep();
    }
});

function nextStep(){
    //con.connect(function(err) {
    //    if (err) {
    //        console.error('error connecting: ' + err.stack);
    //        return;
    //    }
        console.log('connected as id ' + con.threadId);
        console.log("con.query('create table users'");
        con.query('CREATE TABLE users (id int auto_increment,'+
            'email VARCHAR(50), pwd VARCHAR(50), PRIMARY KEY(id))',
            function(err, result){
                if(err) {
                    if (err.errno=1050) {
                        console.log("Table users is exist!");
                    } else {
                        console.log("err", err);
                    }
                } else {
                    console.log("Table users Created", result);
                }
                showStru("users", function(){
                    nextStep2();
                });
            });
    //});
}

function nextStep2(){
    console.log("con.query('create table userdevices'");
    con.query('CREATE TABLE userdevices (id int auto_increment, user_id int, '+
        'device_id VARCHAR(15), device_state int, description VARCHAR(150), PRIMARY KEY(id))',
        function(err, result){
            if(err) {
                if (err.errno=1050) {
                    console.log("Table userdevices is exist!");
                } else {
                    console.log("err", err);
                }
            } else {
                console.log("Table userdevices Created", result);
            }
            showStru("userdevices");
            //con.disconnect();
        });
}

function showStru (tbl_name, cb) {
    con.query("describe "+tbl_name, function(err, res) {
        console.log("err", err, "res", res);
        if (cb) {
            cb();
        }
    })
}