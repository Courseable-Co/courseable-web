loginContainer = document.getElementById('login-container')
emailField = document.getElementById('email-field')
passwordField = document.getElementById('password-field')
confirmPasswordField = document.getElementById('confirm-password-field')
createAccountButton = document.getElementById('create-account-button')
loginButton = document.getElementById("login-button");
errorText = document.getElementById('auth-error-text')

// Initial displays
errorText.style.display = "none"

document.addEventListener("DOMContentLoaded", function() {
    createAccountButton.addEventListener("click", createAccount);
    
    loginButton.addEventListener("click", () => {
        window.location.href = '/login';
    })

    // Auth state changed event
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            userDB = firebase.firestore()
            var userID = user.uid
            
            userDB.collection('users').doc(userID).get().then(function(doc) {
                let data = doc.data()
                window.location.href = '/dashboard';
            })
        }
    });
});

function createAccount() {
    const userEmail = emailField.value;
    const userPassword = passwordField.value;
    const confirmPassword = confirmPasswordField.value;

    if (userPassword !== confirmPassword) {
        errorText.style.display = "block";
        errorText.innerHTML = "Passwords do not match";
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(userEmail, userPassword)
    .then(function(userCredential) {
        // Account created successfully
        const user = userCredential.user;
        console.log("Account created successfully:", user.uid);

        // Create a user object in Firestore
        const userDB = firebase.firestore();
        const userID = user.uid;
        const userDoc = {
            email: userEmail,
            dateCreated: firebase.firestore.FieldValue.serverTimestamp(),
            // Add any other default fields you want here
        };

        userDB.collection('users').doc(userID).set(userDoc)
            .then(() => {
                console.log("User document successfully written!");
                // Redirect to dashboard
                window.location.href = '/dashboard';
            })
            .catch((error) => {
                console.error("Error writing user document: ", error);
                errorText.style.display = "block";
                errorText.innerHTML = "There was an issue creating your account, please try again later or contact support: <br><br>support@tutortree.com";
            });
    })
    .catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("errorCode: " + errorCode + "\n" + "errorMessage: " + errorMessage);

        errorText.style.display = "block";
        if (errorCode === "auth/email-already-in-use") {
            errorText.innerHTML = "The email address is already in use by another account.";
        } else if (errorCode === "auth/invalid-email") {
            errorText.innerHTML = "The email address is not valid.";
        } else if (errorCode === "auth/weak-password") {
            errorText.innerHTML = "The password is too weak.";
        } else {
            errorText.innerHTML = "There was an issue creating your account, please try again later or contact support: <br><br>support@tutortree.com";
        }
    });
}

