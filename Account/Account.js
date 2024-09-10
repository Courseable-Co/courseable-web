


var dateJoinedText, membershipTitle, nextPaymentDate, lastFour, manageMembershipButton
var profileImageContainer, profilePhotoButton, nameField, emailField, saveProfileButton
var accountBackButton
var subscribeDiv, subscribeButton



document.addEventListener("DOMContentLoaded", function() {
    //Get elements
    dateJoinedText = document.getElementById('dateJoinedText')
    membershipTitle = document.getElementById('membershipTitle')
    nextPaymentDate = document.getElementById('nextPaymentDate')
    lastFour = document.getElementById('lastFour')
    manageMembershipButton = document.getElementById('manageMembershipButton')
    subscribeDiv = document.getElementById('subscribeDiv')
    subscribeButton = document.getElementById('subscribeButton')

    profileImageContainer = document.getElementById('profileImageContainer')
    profilePhotoButton = document.getElementById('manageMembershipButton')
    nameField = document.getElementById('nameField')
    emailField = document.getElementById('emailField')

    accountBackButton = document.getElementById('accountBackButton')
    saveProfileButton  = document.getElementById('saveProfileButton')


    //Set initial states
    $(saveProfileButton).hide();

    //Add event listeners
    document.getElementById('profilePhotoInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            uploadProfilePhoto(file);
        }
    });

    accountBackButton.addEventListener('click', () => {
        window.location.href = '/dashboard'
    })

    nameField.addEventListener('input', handleInputChange);
    emailField.addEventListener('input', handleInputChange);
    saveProfileButton.addEventListener('click', function() {
        const updatedData = {};
    
        if (nameField.value !== nameField.placeholder) {
            updatedData.name = nameField.value;
        }
    
        if (emailField.value !== emailField.placeholder) {
            updatedData.email = emailField.value;
        }
    
        updateUserWithData(updatedData);
    });
                        
    // Auth state changed event
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            database.collection('users').doc(user.uid).get().then(function(doc) {
                if (doc.exists) {
                    const data = doc.data();
                    const dateJoined = data.dateJoined.toDate();
                    const formattedDate = formatDate(dateJoined);
                    dateJoinedText.innerHTML = `Member since ${formattedDate}`;
    
                    fetchSubscriptionDetails(data.stripeCustomerID)
                    updateProfilePhotoContainer(data.profileImage)
                    if (data.name) {
                        nameField.placeholder = data.name
                    }

                    if (data.email) {
                        emailField.placeholder = data.email
                    }
                }
            }).catch(function(error) {
                console.log("Error getting user data:", error);
            });
        } else {
            window.location.href = '/login';
        }
    });
})


//============================================Subscription Details==============================================

function fetchSubscriptionDetails(customerID) {
    if (customerID) {
        fetch('https://courseable-d6c39cc199c5.herokuapp.com/get-subscription-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ customer_id: customerID })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching subscription details:', data.error);
                showFreeMembershipElements()
                return;
            }
            console.log(data)
            // Update the UI with the fetched details
            membershipTitle.innerHTML = data.plan_type;
            nextPaymentDate.innerHTML = `Next Payment Date: ${data.next_payment_date}`;
            lastFour.innerHTML = `${data.last_four}`;
            subscribeDiv.style.display = 'none'
            manageMembershipButton.addEventListener('click', () => {
                manageSubscription(customerID)
            })
        })
        .catch(error => {
            console.error('Error fetching subscription details:', error);
            showFreeMembershipElements()
        });

    } else {
        showFreeMembershipElements()
    }
}

function showFreeMembershipElements() {
    membershipTitle.innerHTML = 'Free';
    nextPaymentDate.innerHTML = `All the core features of Courseable, free forever 😍`;
    document.getElementById('payment-methods-div').style.display = 'none'
    manageMembershipButton.style.display = 'none'

    subscribeDiv.style.display = 'flex'
    subscribeButton.addEventListener('click', () => {
        window.location.href = '/subscribe'
    })
}

function manageSubscription(customerID) {
    fetch('https://courseable-d6c39cc199c5.herokuapp.com/create-customer-portal-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customer_id: customerID })
    })
    .then(response => response.json())
    .then(data => {
        if (data.url) {
            window.location.href = data.url;  // Redirect to the Stripe Customer Portal
        } else {
            console.error('Error creating customer portal session:', data.error);
        }
    })
    .catch(error => {
        console.error('Error creating customer portal session:', error);
    });
}





//=============================================Profile Details=======================================================

function updateProfilePhotoContainer(profileImage) {
    profileImageContainer.innerHTML = ''

    if (profileImage) {
        let profilePhotoButton = createDOMElement('img', 'account-profile-photo', profileImage, profileImageContainer)
        profilePhotoButton.addEventListener('click', () => {
            document.getElementById('profilePhotoInput').click();
        })
    } else {
        let profilePhotoButton = createDOMElement('img', 'account-profile-photo', defaultProfilePhotoURL, profileImageContainer)
        profilePhotoButton.addEventListener('click', () => {
            document.getElementById('profilePhotoInput').click(); 
        })
    }
}

function uploadProfilePhoto(file) {
    const user = firebase.auth().currentUser;
    const storageRef = firebase.storage().ref();
    const userPhotoRef = storageRef.child(`users/${user.uid}/profileImages/${file.name}`);

    // Upload the file
    const uploadTask = userPhotoRef.put(file);

    uploadTask.on('state_changed', 
        function(snapshot) {
            // Handle progress, pause, and resume here if needed
        }, 
        function(error) {
            console.error("Error uploading file:", error);
        }, 
        function() {
            // Get the download URL and update the user's profileImage field in Firestore
            uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
                updateUserProfileImage(downloadURL);
            });
        }
    );
}

function updateUserProfileImage(downloadURL) {
    const user = firebase.auth().currentUser;
    const userRef = firebase.firestore().collection('users').doc(user.uid);

    userRef.update({
        profileImage: downloadURL
    }).then(() => {
        console.log("User profile image updated successfully.");
        updateProfilePhotoContainer(downloadURL); // Update the UI with the new image
        let newHeaderPhotoContainer = document.getElementById('profile-photo-container')
        newHeaderPhotoContainer.innerHTML = ''
        createDOMElement('img', 'header-profile-photo', downloadURL, newHeaderPhotoContainer)

    }).catch((error) => {
        console.error("Error updating user profile image:", error);
    });
}

function handleInputChange() {
    // Check if the values have changed
    const nameChanged = nameField.value !== nameField.placeholder;
    const emailChanged = emailField.value !== emailField.placeholder;

    if (nameChanged || emailChanged) {
        $(saveProfileButton).fadeIn(); // Fade in the save button
    } else {
        $(saveProfileButton).fadeOut(); // Optionally fade out if no changes
    }
}

function updateUserWithData(data) {
    const user = firebase.auth().currentUser;

    if (!user) {
        console.error("No authenticated user found.");
        return;
    }

    const userRef = firebase.firestore().collection('users').doc(user.uid);

    // Update Firestore with the provided data
    userRef.update(data).then(() => {
        console.log("User data updated successfully in Firestore.");
        $(saveProfileButton).fadeOut();

    }).catch((error) => {
        console.error("Error updating user data in Firestore:", error);
    });
}


//=============================================Helper Functions=======================================================


function formatDate(date) {
    const options = { year: 'numeric', month: 'long',};
    return date.toLocaleDateString(undefined, options);
}

let defaultProfilePhotoURL = 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/Assets%2Fdefault_profile.png?alt=media&token=d275f8e2-8ade-4d79-81c3-17615a46e26b'

