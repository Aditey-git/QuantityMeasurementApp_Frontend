document.getElementById("registerForm").addEventListener("submit", async function(e){

    e.preventDefault()

    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if(email === "" || password === "" || confirmPassword === "")
    {
        alert("Please fill all fields")
        return
    }

    if(password !== confirmPassword)
    {
        alert("Passwords do not match")
        return
    }

    try {
        const response = await fetch(`http://localhost:5125/api/auth/register?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
            method: 'POST'
        });

        if (!response.ok) {
            alert("Registration failed");
            return;
        }

        alert("Registration successful")
        window.location.href = "login.html"

    } catch (error) {
        console.error("Registration Error", error);
        alert("Cannot reach the server.");
    }

})



function togglePassword(inputId, element){

const passwordInput = document.getElementById(inputId)

if(passwordInput.type === "password")
{
passwordInput.type = "text"
element.textContent = "Hide"
}
else
{
passwordInput.type = "password"
element.textContent = "Show"
}

}