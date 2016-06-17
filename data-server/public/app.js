'use strict';
var config = {
    pathCheckPassword:  "http://localhost:6617/login",
    pathCheckDevID:     "http://localhost:6617/check_devId",
    pathRegNewUser:     "http://localhost:6617/reg_new_user",
    pathUsersData:      "http://localhost:6617/users_data",
    pathUpdateUserData: "http://localhost:6617/update_users_data",
    pathUpdateDevData:  "http://localhost:6617/update_dev_data",
    pathSwitchDev:      "http://localhost:6617/switch"
};

angular.module('myApp', [
  'ngRoute',
  'myApp.view1',
  'myApp.view2',
  'myApp.view3',
  'myApp.version'
]).config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {

  $locationProvider.hashPrefix('!');
  $routeProvider.when("/", {
    templateUrl: 'templates/home.html',
    controller: 'homeController'
  }).otherwise({
    redirectTo: '/view1'
  });

}]).controller('homeController', ["$scope", '$location', 'commonService', function($scope, $location, $service) {

  $scope.tryEnter = function() {
    console.log("in tryEnter", $scope.email, $scope.password);

    $service.email = $scope.email;
    $service.password = $scope.password;

    $service.checkPwd($scope.email, $scope.password, function(res){
        console.log("checking res", res);
        if (res==200) {
            if ($scope.email=="admin") {
                $location.path("/view1");
            } else {
                $location.path("/view3");
            }
        } else {
            if (res==404) { // no such user
                alert("No such user in DB");
                $service.tryRegistryNewUser($scope.email, $scope.password, function(res){
                    if (res==200) {
                        $location.path("/view1");
                    }
                })
            } else { // 403, wrong pwd
                alert("Entered wrong password");
            }
        }
    });
  }
}]).service('commonService', ["$http", function($http){

    this.users = ['John', 'James', 'Jake'];
    var _this = this;

    this.checkPwd = function (email, password, cb) {
        console.log("service sending request to check pwd");
        $http.post(config.pathCheckPassword, {email: email, pwd:password}).then(function(res){
            console.log("service received answer", res);
            if (res.status == 200) {
                if (res.data) {
                    console.log("received data", res.data.userdata);
                    _this.arUserDevData = res.data.userdata;
                }
                _this.email = email;
                _this.password = password;
            }
            if (cb) {
                cb (res.status);
            }
        }, function(err) {
            console.log("err", err);
            if (cb) {
                cb(err.status)
            }
        });
    };

    this.tryRegistryNewUser = function (email, password, cb) {
        if (confirm ("Do you want to registry new user?")) {
            this.email = email;
            this.password = password;

            var devId = prompt("Please, enter you device ID:");
            $http.post(config.pathCheckDevID, {deviceId: devId}).then(function(res){
                if (res.status == 200) {
                    _this.email = email;
                    _this.password = password;
                    $http.post(config.pathRegNewUser, {deviceId: devId, email: email, password: password}).then(function(res){
                        cb (res.status);
                    });
                } else {
                    alert ("No such device in our base. Please, turn it ON, connect to net and try again.");
                    cb (res.status);
                }
            });
        } else {
            cb(403);
        }
    };

    this.getUsersData = function (cb) {
        console.log("try get users data", config.pathUsersData, _this.email, _this.password);
        $http.post(config.pathUsersData, {email: _this.email, password: _this.password}).then(function(res){
            console.log("received data", res.data);
            if (res.status == 200) {
                if (res.data) {
                    _this.arUsersData = res.data;
                }
            } else {
               if (cb) cb();
            }
        });
    };

    this.updateEmail = function (id, email) {
        console.log("try update email", config.pathUpdateUserData, _this.email, _this.password, id, email);
        $http.post(config.pathUpdateUserData, { email: _this.email, password: _this.password, mode: 1,
                                                change_id: id, change_email: email}).then(function(res){
            console.log("received answer", res.status);
            if (res.status == 200) {
                for (var i=0; i<_this.arUsersData.length; i++) {
                    if (_this.arUsersData[i].id == id) {
                        _this.arUsersData[i].email = email;
                    }
                }
            } else {
                alert ("Error on udating data. Try later.");
            }
        });
    };

    this.addUser = function (email) {
        console.log("try add user", config.pathUpdateUserData, _this.email, _this.password, email);
        $http.post(config.pathUpdateUserData, { email: _this.email, password: _this.password, mode: 2,
            change_email: email}).then(function(res){
            console.log("received answer", res.status);
            if (res.status == 200) {
                _this.getUsersData();
            } else {
                alert ("Error on users's adding. Try later.");
            }
        });
    };

    this.deleteUser = function (id) {
        console.log("try delete user", config.pathUpdateUserData, _this.email, _this.password, id);
        $http.post(config.pathUpdateUserData, { email: _this.email, password: _this.password, mode: 3,
            change_id: id}).then(function(res){
            console.log("received answer", res.status);
            if (res.status == 200) {
                _this.getUsersData();
            } else {
                alert ("Error on users's deleting. Try later.");
            }
        });
    };

    this.resetUserPwd = function (id, newPwd) {
        console.log("try reset user pwd", config.pathUpdateUserData, _this.email, _this.password, id, newPwd);
        $http.post(config.pathUpdateUserData, { email: _this.email, password: _this.password, mode: 4,
            change_id: id, newPwd: newPwd}).then(function(res){
            console.log("received answer", res.status);
            if (res.status == 200) {
                //_this.getUsersData();
            } else {
                alert ("Error on users's pwd resetting. Try later.");
            }
        });
    };

    this.changeDevLink = function (device_id, newUid) {
        console.log("Try change link dev to new user", config.pathUpdateDevData, _this.email, _this.password, device_id, newUid);
        $http.post(config.pathUpdateDevData, { email: _this.email, password: _this.password, device_id: device_id, newUid: newUid })
        .then(function(res){
            console.log("received answer", res.status);
            if (res.status == 200) {
                _this.checkPwd(_this.email, _this.password, function(res){
                    console.log("data updated.");
                });
            } else {
                alert ("Error on dev's link change. Try later.");
            }
        }, function (err) {
            alert("err: "+err);
        });
    };

    this.changeDevDescr = function (device_id, newDescr) {
        console.log("Try change link dev to new user", config.pathUpdateDevData, _this.email, _this.password, device_id, newDescr);
        $http.post(config.pathUpdateDevData, { email: _this.email, password: _this.password, device_id: device_id, newDescription: newDescr })
            .then(function(res){
                console.log("received answer", res.status);
                if (res.status == 200) {
                    _this.checkPwd(_this.email, _this.password, function(res){
                        console.log("data updated.");
                    });
                } else {
                    alert ("Error on dev's link change. Try later.");
                }
            }, function (err) {
                alert("err: "+err);
            });
    };

    this.switchDev = function (device_id, command) {
        console.log("Try switch dev to new state", config.pathSwitchDev, _this.email, _this.password, device_id, command);
        $http.post(config.pathSwitchDev, { email: _this.email, password: _this.password, device_id: device_id, command: command})
            .then(function(res){
                console.log("received answer", res.status);
                if (res.status == 200) {
                    console.log("Switched.");
                    alert("Send command to device. Wait until it respond.")
                } else {
                    alert ("Error on device state changing. Try later.");
                }
            }, function (err) {
                alert("err: "+err);
            });
    };

}]);
