'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope','commonService','$location', function($scope, $common, $location) {
  console.log("v1 ctrlr");
  $scope.email = $common.email;
  $scope.password = $common.password;

    $scope.retDevData = function() {
        return $common.arUserDevData;
    };

    $scope.ifAdmin = function() {
        return $scope.email.toLowerCase()=="admin"
    };

    $scope.showUsers = function() {
        $common.getUsersData();
        $location.path("/view2");
    };

    $scope.changeLink = function(data) {
        console.log("change link request", data);
        var newUid = prompt ("Enter new user id", data.user_id);
        if (+newUid>0) {
            $common.changeDevLink(data.device_id, newUid);
        }
    };

    $scope.changeDevDescr = function(data) {
        console.log("change dev descr request", data);
        var newDescr = prompt ("Enter new description", data.description);
        if (newDescr.length>0) {
            $common.changeDevDescr(data.device_id, newDescr);
        }
    }
}]);