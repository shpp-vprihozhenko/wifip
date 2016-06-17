var email, pwd;
const UPDATEINTERVAL = 30000;

var periodicalUpdate = function() {
  console.log("ask server for updated states");
  $.ajax({
    type: "POST",
    url: "/login",
    data: {"data": JSON.stringify({"email": email, "pwd": pwd})},
    success: function (msg) {
      refreshPage(msg.userdata);
    }
  });
};

function refreshPage(userDevData, mode) {
  if (mode) {
    $("h2").detach();
    $("input").detach();
    $("label").detach();
    $(".btn").detach();
    $("body").append("<h2>Your devices:</h2>");
  } else {
    $("table").detach();
    $(".btnRefresh").detach();
  }

  var tbl="<table>";
  tbl += '<col width="150">';
  tbl += '<col width="200">';
  tbl += '<col width="70">';
  tbl += '<tr>';
  tbl += '<th>Device id</th>';
  tbl += '<th>Description</th>';
  tbl += '<th>State</th>';
  tbl += '<th>Switch</th>';
  tbl += '</tr>';

  for(var i=0; i<userDevData.length; i++){
    var id=userDevData[i].device_id;
    var onClickStr="changeDescr(\'"+id+"\')";
    tbl += '<tr>';
    tbl += '<td>'+userDevData[i].device_id+'</td>';
    tbl += '<td onclick="'+onClickStr+'">'+'<div class="hovered" id="descr'+id+'">'+userDevData[i].description+'</div>'+'</td>';
    var stateStr= (userDevData[i].device_state==1) ? "on" : "-";
    tbl += '<td><div id="st'+id+'">'+stateStr+'</div></td>';
    var classOnOff = (userDevData[i].device_state==1) ? "switchOff" : "switchOn";
    onClickStr = "switchDev(\'"+id+"\')";
    tbl += '<td><div class="'+classOnOff+'" onclick="'+onClickStr+'"></td>';
    tbl += '</tr>';
  }
  tbl += '</table>';
  $("body").append(tbl);
  $("body").append("<button class='btnRefresh' onclick='periodicalUpdate()'>Refresh</di>");
}

function go(){
  email=document.getElementById("email").value;
  pwd=document.getElementById("pwd").value;
  $.ajax({
    type: "POST",
    url: "/login",
    data: {"data": JSON.stringify({"email":email, "pwd":pwd})},
    success: function(msg){
      console.log( "Data sent & received answer: ", msg );
      if (msg.state == "ok"){
        refreshPage(msg.userdata, 1);
        setInterval(periodicalUpdate, UPDATEINTERVAL);
      } else {
        $(".btn").append("<h3>Wrong passwrod or e-mail</h3>");
      }
    }
  });
}

function changeDescr(id){
  console.log("change descr for id", id);
  var descr = prompt("Enter description for "+id, $("#descr"+id).text());
  console.log("New descr", descr);
  $("#descr"+id).text(descr);
  $.ajax({
    type: "POST",
    url: "/updtdescr",
    data: {"id": id, "descr": descr, "email":email, "pwd":pwd},
    success: function(msg){
      console.log( "Data sent & received answer: ", msg );
    }
  });
}

function switchDev(id) {
  var curState=$("#st"+id).text();
  console.log("switch dev "+id, "current state ",curState);
  $.ajax({
    type: "POST",
    url: "/switch",
    data: {"id": id, "curState": curState, "email":email, "pwd":pwd},
    success: function (msg) {
      console.log(msg);
    }
  });
}

function test(){
  console.log("test");
}
