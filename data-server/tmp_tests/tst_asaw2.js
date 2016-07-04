/**
 * Created by Uzer on 29.02.2016.
 */
var async = require('asyncawait/async');
var await = require('asyncawait/await');

function delay(){
  return function (cb) {
    setTimeout(function(){
      //console.log(".");
      cb();
    }, 2);
  }
}

var asLoop=async(function(){
  for(var i=0; i<1000000; i++){
    await(delay());
    if(i%1000==0)
      console.log("next 1000...", i);
  }
});

asLoop().then(function(){
  console.log("that's all!");
});
