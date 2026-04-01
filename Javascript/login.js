const app = angular.module('LoginApp', []);

app.controller('LoginController', function ($scope, $http, $window) {
    const backendBaseUrl = "http://localhost:5125";

    $scope.email = "";
    $scope.password = "";
    $scope.showPassword = false;

    $scope.login = function () {
        if (!$scope.email || !$scope.password) {
            alert("Please fill all fields");
            return;
        }




        const loginUrl = `${backendBaseUrl}/api/auth/login?email=${encodeURIComponent($scope.email)}&password=${encodeURIComponent($scope.password)}`;



        $http.post(loginUrl)
            .then(function (response) {
                const data = response.data;
                $window.localStorage.setItem("authToken", data.token);
                $window.location.href = "../Html/Measurement.html";
            })
            .catch(function (error) {
                console.error("Login Error:", error);
                if (error.status === 401) {
                    alert("Invalid Email or Password!");
                } else {
                    alert("Cannot reach the server.");
                }
            });
    };
});