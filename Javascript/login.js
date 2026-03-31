document.getElementById("loginForm").addEventListener("submit", async function(e){

    e.preventDefault()

    const email=document.getElementById("email").value
    const password=document.getElementById("password").value

    if(email===""||password===""){
        alert("Please fill all fields")
        return
    }

    try {
        const response = await fetch(`http://localhost:5125/api/auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
            method: 'POST'
        });

        if (!response.ok) {
            alert("Invalid Email or Password!");
            return;
        }

        const data = await response.json();
        localStorage.setItem("authToken", data.token);
        window.location.href="../Html/Measurement.html"

    } catch (error) {
        console.error("Login Error:", error);
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