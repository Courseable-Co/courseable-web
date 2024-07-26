
loginContainer = document.getElementById('login-container')
createAccount = document.getElementById('create-account-button')
signInButton = document.getElementById("login-button");
errorText = document.getElementById('auth-error-text')

forgotContainer = document.getElementById('forgot-container')
forgotButton = document.getElementById('forgot-button')
forgotErrorText = document.getElementById('forgot-error-text')
navBack = document.getElementById('nav-back')
resetButton = document.getElementById('reset-button')

passwordResetForm = document.getElementById('password-reset-form')
passwordResetConfirmation = document.getElementById('reset-confirmation')
showPasswordReset = document.getElementById('show-password-reset')
sentNavBack = document.getElementById('sent-nav-back')
resetButton = document.getElementById('reset-button')


//Initial displays
errorText.style.display = "none"
forgotErrorText.style.display = "none"
forgotContainer.style.display = "none"


document.addEventListener("DOMContentLoaded", function() {

    //Set onclick listeners
    signInButton.addEventListener("click", signIn);
    resetButton.addEventListener("click", sendPasswordReset);

    createAccount.addEventListener('click', () => {
        window.location.href = '/create-account';
    });
                                   
    forgotButton.addEventListener('click', () => {
        passwordResetForm.style.display = "block"
        passwordResetConfirmation.style.display = "none"
        
        $("#login-container").fadeOut(function(){
            $("#forgot-container").fadeIn();
        });
    });
                                  
    navBack.addEventListener('click', () => {
        $("#forgot-container").fadeOut(function(){
            $("#login-container").fadeIn();
        });
    });
                             
    sentNavBack.addEventListener('click', () => {
        $("#forgot-container").fadeOut(function(){
            $("#login-container").fadeIn();
        });
    });
                             
    showPasswordReset.addEventListener('click', () => {
        $("#reset-confirmation").fadeOut(function(){
            $("#password-reset-form").fadeIn();
        });
    });
    
                                   
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

                                  

function signIn(){
    userEmail = document.getElementById('email-field').value
    userPassword = document.getElementById('password-field').value
    
    firebase.auth().signInWithEmailAndPassword(userEmail, userPassword).catch(function(error){
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("errorCode: " + errorCode +"\n"+ "errorMessage: " + errorMessage)
        
        errorText.style.display = "block"
        if (errorCode == "auth/wrong-password") {
            errorText.innerHTML = "Your password is incorrect"
            
        } else if (errorCode == "auth/too-many-requests") {
            errorText.innerHTML = "Your account has been disabled for too many failed attempts. Please reset your password."
            
        } else {
            errorText.innerHTML = "There was an issue signing in, plese try again later or contact support : <br><br>support@courseable.co"

        }
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