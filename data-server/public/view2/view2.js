'use strict';

angular.module('myApp.view2', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view2', {
    templateUrl: 'view2/view2.html',
    controller: 'View2Ctrl'
  });
}])

.controller('View2Ctrl', ['$scope','commonService','$location', function($scope, $common, $location) {
    console.log("v2 ctrlr");
    $scope.email = $common.email;
    $scope.password = $common.password;

    $scope.retUsersData = function() {
        return $common.arUsersData;
    };

    $scope.changeEmail = function(data) {
        console.log("changing email", data);
        var oldEmail = data.email;
        var newEmail = oldEmail;
        newEmail = prompt("Enter new email", newEmail);
        if (newEmail.length>0) {
            if (oldEmail!=newEmail) {
                $common.updateEmail(data.id, newEmail);
            }
        }
    };

    $scope.addUser = function() {
        console.log("adding new user");
        var newEmail = prompt("Enter new email", "");
        if (newEmail.length>0) {
            $common.addUser(newEmail);
        }
    };

    $scope.deleteUser = function (id) {
        console.log("deleting user", id);
        if (confirm("Are you sure to delete user?")) {
            $common.deleteUser(id);
        }
    };

    $scope.resetPwd = function (id) {
        console.log("Reset user pwd", id);
        if (confirm("Are you sure to reset user pwd?")) {
            var newPwd = prompt("Enter new password");
            $common.resetUserPwd(id, newPwd);
        }
    };

    $scope.goBack = function() {
        $location.path("/view1")
    }

}]);