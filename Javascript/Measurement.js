const units = {
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

const categoryInput = document.getElementById("category");
const unit1 = document.getElementById("unit1");
const unit2 = document.getElementById("unit2");
const targetUnit = document.getElementById("targetUnit");
const operationSelect = document.getElementById("operation");
const categoryButtonsContainer = document.getElementById("categoryButtons");
const resultBox = document.getElementById("result-box");

const iconMap = {
    Length: "📏",
    Weight: "⚖️",
    Volume: "🧴",
    Temperature: "🌡️"
};

const backendBaseUrl = "http://localhost:5125"; // update to your backend origin if different


function buildCategoryButtons() {
    categoryButtonsContainer.innerHTML = "";

    Object.keys(units).forEach((category) => {
        const button = document.createElement("button");
        button.setAttribute("type", "button");
        button.className = "category-btn";
        button.dataset.category = category;
        button.innerHTML = `<span>${iconMap[category] || "📌"}</span>${category}`;

        button.addEventListener("click", () => setCategory(category));

        categoryButtonsContainer.appendChild(button);
    });
}

function setCategory(category) {
    categoryInput.value = category;

    document.querySelectorAll(".category-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.category === category);
    });

    populateUnits();
    updateOperationOptions();
    resultBox.textContent = "Category set to " + category + ", pick operation and values to run.";
}

function populateUnits() {
    const category = categoryInput.value;
    const availableUnits = units[category] || [];

    unit1.innerHTML = "";
    unit2.innerHTML = "";
    targetUnit.innerHTML = "";

    availableUnits.forEach((unit) => {
        const option1 = document.createElement("option");
        option1.value = unit;
        option1.textContent = unit;

        const option2 = document.createElement("option");
        option2.value = unit;
        option2.textContent = unit;

        const optionTarget = document.createElement("option");
        optionTarget.value = unit;
        optionTarget.textContent = unit;

        unit1.appendChild(option1);
        unit2.appendChild(option2);
        targetUnit.appendChild(optionTarget);
    });

    if (availableUnits.length > 0) {
        targetUnit.value = availableUnits[0];
    }
}


function updateOperationOptions() {
    if (categoryInput.value === "Temperature") {
        operationSelect.innerHTML = "<option value=\"Compare\">Compare</option>";
    } else {
        operationSelect.innerHTML = `
            <option value="Compare">Compare</option>
            <option value="Add">Add</option>
            <option value="Subtract">Subtract</option>
            <option value="Divide">Divide</option>
        `;
    }
    updateOperatorIcon();
}

function updateOperatorIcon() {
    const iconElement = document.getElementById("operatorIcon");
    if (!iconElement) return;
    
    const op = operationSelect.value;
    if (op === "Compare") iconElement.textContent = "⚖️";
    else if (op === "Add") iconElement.textContent = "➕";
    else if (op === "Subtract") iconElement.textContent = "➖";
    else if (op === "Divide") iconElement.textContent = "➗";
}

operationSelect.addEventListener("change", updateOperatorIcon);

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

function displayResult(message) {
    resultBox.textContent = message;
    resultBox.style.animation = "none";
    void resultBox.offsetWidth;
    resultBox.style.animation = null;
}

async function handleSubmit(event) {
    event.preventDefault();

    const category = categoryInput.value;
    const operation = operationSelect.value;
    const selectedUnit1 = unit1.value;
    const selectedUnit2 = unit2.value;
    const selectedTarget = targetUnit.value;
    const value1 = parseFloat(document.getElementById("value1").value);
    const value2 = parseFloat(document.getElementById("value2").value);

    if (Number.isNaN(value1) || Number.isNaN(value2)) {
        return displayResult("Please enter valid numbers for both values.");
    }

    const operationMap = {
        "Compare": 1,
        "Add": 2,
        "Subtract": 3,
        "Divide": 4
    };

    const requestDTO = {
        MeasurementCategory: category,
        OperationType: operationMap[operation],
        MeasurementUnit1: selectedUnit1,
        MeasurementValue1: value1,
        MeasurementUnit2: selectedUnit2,
        MeasurementValue2: value2,
        TargetMeasurementUnit: selectedTarget
    };

    const operationUrl = `${backendBaseUrl}/api/quantities/${operation.toLowerCase()}`;

    try {
        const token = localStorage.getItem("authToken");
        const headers = {
            "Content-Type": "application/json"
        };
        
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(operationUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestDTO)
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                return displayResult("Authentication required: login first or remove authorization requirement from API.");
            }
            const text = await response.text();
            return displayResult(`Backend error (${response.status}): ${text}`);
        }

        const data = await response.json();

        if (!data.isSuccess) {
            return displayResult(`Error from server: ${data.errorMessage || 'Unknown error'}`);
        }

        if (data.isComparison) {
            if (data.areEqual) {
                displayResult(`Result: ${value1} ${selectedUnit1} is equal to ${value2} ${selectedUnit2}`);
            } else {
                const base1 = convertValue(category, value1, selectedUnit1);
                const base2 = convertValue(category, value2, selectedUnit2);
                const cmp = base1 > base2 ? "greater" : "less";
                displayResult(`Result: ${value1} ${selectedUnit1} is ${cmp} than ${value2} ${selectedUnit2}`);
            }
        } else {
            let symbol = "";
            if (operation === "Add") symbol = "➕";
            else if (operation === "Subtract") symbol = "➖";
            else if (operation === "Divide") symbol = "➗";
            
            const niceValue = formatResult(data.calculatedValue);
            displayResult(`${value1} ${selectedUnit1} ${symbol} ${value2} ${selectedUnit2} = ${niceValue} ${selectedTarget}`);
        }
    } catch (error) {
        console.error("Measurement API call failed", error);
        displayResult("Cannot reach backend. Please ensure the API server is running and CORS is enabled.");
    }
}

buildCategoryButtons();
setCategory(categoryInput.value || "Length");

document.getElementById("measurementForm").addEventListener("submit", handleSubmit);
