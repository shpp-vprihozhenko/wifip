var PORT = "6616";

//var HOST = '127.0.0.1';
var HOST = '54.213.253.8';

var testMsg="id=pw5ccf7f059303&login=opinionbutton.shpp&pass=idtest&status=off";

var net=require("net");
var clientSocket=new net.Socket();

clientSocket.on("data",function (data){
  console.log("Received "+data);
	if(data=testMsg) console.log("Source msg delivered correctly.");
	else console.log("Wrong answer from server, msg delivered incorrectly!");
});

clientSocket.on("close",function (){
  console.log("Connection closed");
});

clientSocket.connect(PORT,HOST,function(){
	console.log("Connected to server.")
});

clientSocket.setEncoding("utf8");

clientSocket.write(testMsg);