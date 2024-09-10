document.addEventListener("DOMContentLoaded", function() {
    const createAccountButton = document.getElementById('create-account-button');
    const googleSignUpButton = document.getElementById('google-sign-up');
    const appleSignUpButton = document.getElementById('apple-sign-up')
    const errorText = document.getElementById('auth-error-text');
    const loginButton = document.getElementById('login-button')

    loginButton.addEventListener('click', () => {window.location.href = '/login'})
    createAccountButton.addEventListener('click', createAccount);
    googleSignUpButton.addEventListener('click', googleSignUp);
    appleSignUpButton.addEventListener('click', appleSignUp);
    
    errorText.style.display = "none";

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            checkOrCreateUser(user);
        }
    });
});

function createAccount() {
    const email = document.getElementById('email-field').value;
    const password = document.getElementById('password-field').value;
    const confirmPassword = document.getElementById('confirm-password-field').value;
    const errorText = document.getElementById('auth-error-text');

    if (password !== confirmPassword) {
        errorText.textContent = "Passwords do not match.";
        errorText.style.display = "block";
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Account created successfully", userCredential.user);
            checkOrCreateUser(userCredential.user);
        })
        .catch((error) => {
            errorText.textContent = error.message;
            errorText.style.display = "block";
            console.error("Error creating account:", error);
        });
}

function googleSignUp() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("Google sign-in successful", result.user);
            checkOrCreateUser(result.user);
        })
        .catch((error) => {
            document.getElementById('auth-error-text').textContent = error.message;
            document.getElementById('auth-error-text').style.display = "block";
            console.error("Error with Google sign-in:", error);
        });
}

function appleSignUp() {
    const provider = new firebase.auth.OAuthProvider('apple.com');
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("Apple sign-in successful", result.user);
            checkOrCreateUser(result.user);
        })
        .catch((error) => {
            document.getElementById('auth-error-text').textContent = error.message;
            document.getElementById('auth-error-text').style.display = "block";
            console.error("Error with Apple sign-in:", error);
        });
}

function checkOrCreateUser(user) {
    var userDB = firebase.firestore();

    userDB.collection('users').doc(user.uid).get().then(function(doc) {
        if (!doc.exists) {
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
