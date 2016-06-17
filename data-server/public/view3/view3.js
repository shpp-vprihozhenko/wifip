'use strict';
angular.module('myApp.view3', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view3', {
    templateUrl: 'view3/view3.html',
    controller: 'View3Ctrl'
  });
}])

.controller('View3Ctrl', ['$scope','commonService','$location', function($scope, $common, $location) {
  console.log("v3 ctrlr");
  $scope.email = $common.email;
  $scope.password = $common.password;

    $scope.retDevData = function() {
        return $common.arUserDevData;
    };

    $scope.changeDevDescr = function(data) {
        console.log("change dev descr request", data);
        var newDescr = prompt ("Enter new description", data.description);
        if (newDescr.length>0) {
            $common.changeDevDescr(data.device_id, newDescr);
        }
    };

    $scope.turnOnOff = function(devId, cmd) {
        console.log("turnOnOff", devId, cmd);
        $common.switchDev(devId, cmd);
    };

    $scope.refreshData = function() {
        $common.checkPwd($scope.email, $scope.password);
    }
}]);