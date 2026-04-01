const app = angular.module('MeasurementApp', []);

app.controller('MeasurementController', function($scope, $http, $window) {
    const backendBaseUrl = "http://localhost:5125"; 

    $scope.units = {
        Length: ["Feet", "Inch", "Yard", "Centimeters"],
        Weight: ["Kilogram", "Gram", "Pound"],
        Volume: ["Litre", "Millilitre", "Gallon"],
        Temperature: ["Celsius", "Fahrenheit", "Kelvin"]
    };

    const conversions = {
        Length: { Feet: 12, Inch: 1, Yard: 36, Centimeters: 0.393701 },
        Weight: { Kilogram: 1000, Gram: 1, Pound: 453.592 },
        Volume: { Litre: 1000, Millilitre: 1, Gallon: 3785.41 },
    };

    $scope.iconMap = {
        Length: "📏",
        Weight: "⚖️",
        Volume: "🧴",
        Temperature: "🌡️"
    };

    $scope.currentCategory = "";
    $scope.availableUnits = [];
    $scope.availableOperations = [];
    $scope.operation = "Compare";
    $scope.unit1 = "";
    $scope.unit2 = "";
    $scope.targetUnit = "";
    $scope.value1 = null;
    $scope.value2 = null;
    $scope.operatorIcon = "⚖️";
    $scope.resultMessage = "Pick operation and values to run.";

    $scope.setCategory = function(category) {
        $scope.currentCategory = category;
        $scope.availableUnits = $scope.units[category] || [];
        
        $scope.unit1 = $scope.availableUnits[0];
        $scope.unit2 = $scope.availableUnits[0];
        $scope.targetUnit = $scope.availableUnits[0];

        if (category === "Temperature") {
            $scope.availableOperations = ["Compare"];
            $scope.operation = "Compare";
        } else {
            $scope.availableOperations = ["Compare", "Add", "Subtract", "Divide"];
        }

        $scope.updateOperatorIcon();
        $scope.resultMessage = "Category set to " + category + ", pick operation and values to run.";
    };

    $scope.updateOperatorIcon = function() {
        if ($scope.operation === "Compare") $scope.operatorIcon = "⚖️";
        else if ($scope.operation === "Add") $scope.operatorIcon = "➕";
        else if ($scope.operation === "Subtract") $scope.operatorIcon = "➖";
        else if ($scope.operation === "Divide") $scope.operatorIcon = "➗";
    };

    function convertTemperature(value, fromUnit, toUnit) {
        let c = value;
        if (fromUnit === "Fahrenheit") c = (value - 32) * (5 / 9);
        else if (fromUnit === "Kelvin") c = value - 273.15;
        if (toUnit === "Celsius") return c;
        if (toUnit === "Fahrenheit") return c * (9 / 5) + 32;
        if (toUnit === "Kelvin") return c + 273.15;
        return value;
    }

    function convertValue(category, value, unit) {
        if (category === "Temperature") {
            return convertTemperature(value, unit, "Celsius");
        }
        const factor = conversions[category]?.[unit] ?? 1;
        return value * factor;
    }

    function formatResult(value) {
        return Number.isFinite(value) ? Number(value.toFixed(6)).toString() : "NaN";
    }

    $scope.handleSubmit = function() {
        if ($scope.value1 === null || ($scope.operation !== "Compare" && $scope.value2 === null)) {
            $scope.resultMessage = "Please enter valid numbers.";
            return;
        }

        const operationMap = {
            "Compare": 1,
            "Add": 2,
            "Subtract": 3,
            "Divide": 4
        };

        const requestDTO = {
            MeasurementCategory: $scope.currentCategory,
            OperationType: operationMap[$scope.operation],
            MeasurementUnit1: $scope.unit1,
            MeasurementValue1: parseFloat($scope.value1),
            MeasurementUnit2: $scope.unit2,
            MeasurementValue2: parseFloat($scope.value2 || 0),
            TargetMeasurementUnit: $scope.targetUnit
        };

        const operationUrl = `${backendBaseUrl}/api/quantities/${$scope.operation.toLowerCase()}`;
        const token = $window.localStorage.getItem("authToken");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        $http.post(operationUrl, requestDTO, { headers: headers })
            .then(function(response) {
                const data = response.data;
                if (!data.isSuccess) {
                    $scope.resultMessage = `Error from server: ${data.errorMessage || 'Unknown error'}`;
                    return;
                }

                if (data.isComparison) {
                    if (data.areEqual) {
                        $scope.resultMessage = `Result: ${$scope.value1} ${$scope.unit1} is equal to ${$scope.value2} ${$scope.unit2}`;
                    } else {
                        const base1 = convertValue($scope.currentCategory, $scope.value1, $scope.unit1);
                        const base2 = convertValue($scope.currentCategory, $scope.value2, $scope.unit2);
                        const cmp = base1 > base2 ? "greater" : "less";
                        $scope.resultMessage = `Result: ${$scope.value1} ${$scope.unit1} is ${cmp} than ${$scope.value2} ${$scope.unit2}`;
                    }
                } else {
                    const niceValue = formatResult(data.calculatedValue);
                    $scope.resultMessage = `${$scope.value1} ${$scope.unit1} ${$scope.operatorIcon} ${$scope.value2} ${$scope.unit2} = ${niceValue} ${$scope.targetUnit}`;
                }
            })
            .catch(function(error) {
                console.error("Measurement API call failed", error);
                if (error.status === 401 || error.status === 403) {
                    $scope.resultMessage = "Authentication required: login first.";
                } else {
                    $scope.resultMessage = "Cannot reach backend or server error.";
                }
            });
    };

    // Initialize default state
    $scope.setCategory("Length");
});
