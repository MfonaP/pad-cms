document.addEventListener('DOMContentLoaded', function() {

    console.log("Login script loaded.");

    const loginForm = document.getElementById('loginForm');
    const adminEmailInput = document.getElementById('adminEmail');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginMessage = document.getElementById('loginMessage');
    const logoutBtn = document.getElementById('logoutBtn'); // Ensure this element is retrieved

    // Firebase Login
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission

            const enteredEmail = adminEmailInput.value;
            const enteredPassword = adminPasswordInput.value;

            // Basic client-side validation (optional, Firebase will also validate)
            if (!enteredEmail || !enteredPassword) {
                if (loginMessage) {
                    loginMessage.textContent = 'Please enter both email and password.';
                    loginMessage.classList.add('alert', 'alert-danger');
                    loginMessage.classList.remove('alert-success');
                }
                return;
            }

            //USE FIREBASE AUTHENTICATION
            firebase.auth().signInWithEmailAndPassword(enteredEmail, enteredPassword)
                .then((userCredential) => {
                    // Signed in successfully
                    const user = userCredential.user;
                    console.log("Firebase login successful!", user);

                    if (loginMessage) {
                        loginMessage.textContent = 'Login successful! Redirecting...';
                        loginMessage.classList.add('alert', 'alert-success');
                        loginMessage.classList.remove('alert-danger');
                    }

                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                        window.location.href = 'adminDashboard.html';
                    }, 1000); // 1-second delay for success message to be seen
                })
                .catch((error) => {
                    // Handle login errors
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error("Firebase login error:", errorCode, errorMessage);

                    let displayMessage = 'Login failed. Please try again.';
                    if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
                        displayMessage = 'Invalid email or password.';
                    } else if (errorCode === 'auth/invalid-email') {
                        displayMessage = 'The email address is not valid.';
                    }
                    // You can add more specific error messages based on Firebase error codes

                    if (loginMessage) {
                        loginMessage.textContent = displayMessage;
                        loginMessage.classList.add('alert', 'alert-danger');
                        loginMessage.classList.remove('alert-success');
                    } else {
                        alert(displayMessage); // Fallback if loginMessage div not present
                    }
                });
        });
    } else {
        console.error("Login form with ID 'loginForm' not found.");
    }
});