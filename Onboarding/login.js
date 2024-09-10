document.addEventListener("DOMContentLoaded", function() {
    const emailLoginButton = document.getElementById('email-login');
    const googleLoginButton = document.getElementById('google-login');
    const appleLoginButton = document.getElementById('apple-login');
    const errorText = document.getElementById('auth-error-text');

    emailLoginButton.addEventListener('click', emailLogin);
    googleLoginButton.addEventListener('click', googleLogin);
    appleLoginButton.addEventListener('click', appleLogin);

    errorText.style.display = "none";

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            checkOrCreateUser(user)
        }
    });

    // Hide loading screen after 2 seconds
    setTimeout(function() {
        $("#loading-screen").fadeOut();
    }, 2000);
});

function emailLogin() {
    const email = document.getElementById('email-field').value;
    const password = document.getElementById('password-field').value;
    const errorText = document.getElementById('auth-error-text');

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Email login successful", userCredential.user);
            checkOrCreateUser(userCredential.user)
        })
        .catch((error) => {
            errorText.textContent = error.message;
            errorText.style.display = "block";
            console.error("Error with email login:", error);
        });
}

function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("Google login successful", result.user);
            checkOrCreateUser(result.user)
        })
        .catch((error) => {
            document.getElementById('auth-error-text').textContent = error.message;
            document.getElementById('auth-error-text').style.display = "block";
            console.error("Error with Google login:", error);
        });
}

function appleLogin() {
    const provider = new firebase.auth.OAuthProvider('apple.com');
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("Apple login successful", result.user);
            checkOrCreateUser(result.user)
        })
        .catch((error) => {
            document.getElementById('auth-error-text').textContent = error.message;
            document.getElementById('auth-error-text').style.display = "block";
            console.error("Error with Apple login:", error);
        });
}



                                  
function sendPasswordReset() {
    var emailAddress = document.getElementById('reset-email-field').value;

    const animation = lottie.loadAnimation({
        container: document.getElementById('email-sent-animation'), // the DOM element that will contain the animation
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: 'https://assets-global.website-files.com/65aaa2548e6fb3aa312ce75e/663fae16b44dcaec02f544ea_email-sent.json' // the path to the animation json
    });
    
    firebase.auth().sendPasswordResetEmail(emailAddress).then(function() {
        // Email sent.
        animation.goToAndPlay(0, true); // Play from the start
        forgotErrorText.style.display = "none";
        document.getElementById("password-reset-form").style.display = 'none'
        $("#reset-confirmation").fadeIn()
        
        
    }).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("errorCode: " + errorCode + "\n" + "errorMessage: " + errorMessage);
        
        forgotErrorText.style.display = "block";
        if (errorCode == "auth/user-not-found") {
            forgotErrorText.innerHTML = "There is no account matching that email. Please try again";
        } else {
            forgotErrorText.innerHTML = "There was an issue sending your email. Please try again";

        }
    });
}

function checkOrCreateUser(user) {
    var userDB = firebase.firestore();
    mixpanel.identify(user.id)

    userDB.collection('users').doc(user.uid).get().then(function(doc) {
        if (!doc.exists) {
            console.log(doc)
            var currentDate = new Date();
            userDB.collection('users').doc(user.uid).set({
                id: user.uid,
                email: user.email,
                name: "",
                isSubscribed: false,
                dateJoined : firebase.firestore.Timestamp.fromDate(currentDate)
            }).then(() => {
                console.log("New user created with UID:", user.uid);
                mixpanel.identify(user.uid)
                mixpanel.people.set({ 
                    'userID' : user.uid,
                    '$name': 'Jane Doe',
                    '$email': user.email});
                window.location.href = '/subscribe';
            }).catch(error => {
                console.error("Error creating user:", error);
            });
        } else {
            console.log("User already exists in Firestore:", user.uid);
            window.location.href = '/dashboard';
        }
    }).catch(error => {
        console.error("Error checking user existence:", error);
    });
}