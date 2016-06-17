var net = require("net");
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var config = require("../myConfig.json");

var init = function (con) {

    var PORT = config.tcpPort; //6616;
    this.arDevCmdId=[];
    this.arDevCmd=[];
    var _this = this;

    net.createServer(function (socket) {
        var msg = "Incoming connection established with " + socket.remoteAddress + ":" + socket.remotePort;
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

            var cmdPos = _this.arDevCmdId.indexOf(data_obj.id);
            if (cmdPos > -1){
                if(data_obj.key){ // set new status & annulate previous command
                    socket.write("key="+data_obj.key);
                    console.log("writing to socket: '"+"key="+data_obj.key+"'");
                  _this.arDevCmd.splice(cmdPos, 1);
                  _this.arDevCmdId.splice(cmdPos, 1);
                    data_obj.status = data_obj.key;
                    console.log("Key command received for", data_obj.id, "Remove last command. Status set to", data_obj.status);
                } else {
                    socket.write(_this.arDevCmd[cmdPos]);
                    console.log("Sending command "+_this.arDevCmd[cmdPos]+" for", data_obj.id);
                  _this.arDevCmd.splice(cmdPos, 1);
                  _this.arDevCmdId.splice(cmdPos, 1)
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

};

module.exports = {
    init: init
};
