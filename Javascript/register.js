const app = angular.module('RegisterApp', []);

app.controller('RegisterController', function($scope, $http, $window) {
    const backendBaseUrl = "http://localhost:5125";
    
    $scope.email = "";
    $scope.password = "";
    $scope.confirmPassword = "";
    $scope.showPassword = false;
    $scope.showConfirmPassword = false;

    $scope.register = function() {
        if (!$scope.email || !$scope.password || !$scope.confirmPassword) {
            alert("Please fill all fields");
            return;
        }

        if ($scope.password !== $scope.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        const registerUrl = `${backendBaseUrl}/api/auth/register?email=${encodeURIComponent($scope.email)}&password=${encodeURIComponent($scope.password)}`;

        $http.post(registerUrl)
            .then(function(response) {
                alert("Registration successful");
                $window.location.href = "login.html";
            })
            .catch(function(error) {
                console.error("Registration Error", error);
                if (error.status === 400 || error.status === 401) {
                    alert("Registration failed");
                } else {
                    alert("Cannot reach the server.");
                }
            });
    };
});