

var toggleMonthly, toggleYearly, subscriptionAmountText, yearlyText
var subscribeButton, freeButton

var selectedSubscriptionType = "yearly"
var currentUserID


document.addEventListener("DOMContentLoaded", function() {
    toggleMonthly = document.getElementById('toggle-monthly')
    toggleYearly = document.getElementById('toggle-yearly')
    subscriptionAmountText = document.getElementById('subscription-pricing')
    yearlyText = document.getElementById('yearly-text')
    subscribeButton = document.getElementById('subscribe-button')
    freeButton = document.getElementById('free-button')

    toggleMonthly.addEventListener('click', () => {
        toggleMonthly.classList.remove('toggle-selected')
        toggleYearly.classList.remove('toggle-selected')
        toggleMonthly.classList.add('toggle-selected')
        subscriptionAmountText.innerHTML = '$18'
        yearlyText.style.display = 'none'
        $(yearlyText).fadeOut()
        selectedSubscriptionType = 'monthly'
    })

    toggleYearly.addEventListener('click', () => {
        toggleMonthly.classList.remove('toggle-selected')
        toggleYearly.classList.remove('toggle-selected')
        toggleYearly.classList.add('toggle-selected')
        subscriptionAmountText.innerHTML = '$14'
        $(yearlyText).fadeIn()
        selectedSubscriptionType = 'yearly'
    })

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUserID = user.uid;
        }
    });

    subscribeButton.addEventListener("click", function() {
        // First, check if the user has a stripeCustomerID in Firestore
        database.collection('users').doc(currentUserID).get().then(function(doc) {
            if (doc.exists && doc.data().stripeCustomerID) {
                // If stripeCustomerID exists, proceed to checkout
                createCheckoutSession(doc.data().stripeCustomerID);
            } else {
                // If stripeCustomerID does not exist, create it first on the server
                fetch('https://courseable-d6c39cc199c5.herokuapp.com/create-stripe-customer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user_id: currentUserID })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.customer_id) {
                        // Once the customer is created, proceed to checkout
                        createCheckoutSession(data.customer_id);
                    } else {
                        console.error('Failed to create Stripe customer:', data.error);
                    }
                })
                .catch(error => console.error('Error in creating Stripe customer:', error));
            }
        }).catch(function(error) {
            console.error("Error checking user data:", error);
        });
    });

    function createCheckoutSession(stripeCustomerID) {
        fetch('https://courseable-d6c39cc199c5.herokuapp.com/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUserID,
                subscription_type: selectedSubscriptionType
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.url) {
                window.location.href = data.url;  // Redirect to Stripe Checkout
            } else {
                console.error('Failed to create checkout session:', data.error);
            }
        })
        .catch(error => console.error('Error in creating checkout session:', error));
    }
})