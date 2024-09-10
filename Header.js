
/**
 * Creates a DOM element and appends it to a specified parent element.
 * @param {string} type - The type of the HTML element to create.
 * @param {string} className - The CSS class for the element.
 * @param {string} value - The text content or src for the element.
 * @param {HTMLElement} parent - The parent element to which the new element will be appended.
 * @param {function} onClick - The action for the element to perfom when clicked.
 */
function createDOMElement(type, className, value, parent, onClick) {
    let element = document.createElement(type);
    element.className = className;
    if (type === 'img') {
        element.src = value;
    } else {
        element.textContent = value;
    }
    if (onClick) {
        element.addEventListener('click', onClick);
    }
    if (parent) {
        parent.appendChild(element);
    }
    return element;
}


// Globals
let currentCourse = null;
var currentUserID = ""
var numCourses = 0
var isSubscribed 

document.addEventListener("DOMContentLoaded", function() {
    currentCourse = JSON.parse(localStorage.getItem('currentCourse'));

    // Get elements
    const logoutButton = document.getElementById('logout-button');
    const profilePhotoContainer = document.getElementById('profile-photo-container')

    // Initial displays
    profilePhotoContainer.innerHTML = ""

    // Set onclick listeners
    logoutButton.addEventListener("click", logout);

    // Auth state changed event
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUserID = user.uid;
            console.log(currentUserID)
            database.collection('users').doc(currentUserID).get().then(function(doc) {
                if (doc.exists) {
                    mixpanel.identify(currentUserID)
                    const data = doc.data();
                    checkSubscriptionStatus(data.stripeCustomerID)
                    if (data.profileImage) {
                        createDOMElement('img', 'header-profile-photo', data.profileImage, profilePhotoContainer)
                    } else {
                        createDOMElement('div', 'default-profile-photo', '', profilePhotoContainer)
                    }

                    updateCourseHeader()

                } else {
                    console.log("No such document!");
                    createDOMElement('div', 'default-profile-photo', '', profilePhotoContainer)
                }
            }).catch(function(error) {
                console.log("Error getting user data:", error);
            });
        } else {
            window.location.href = '/login';
        }
    });

});

function updateCourseHeader() {
    const headerCourseCode = document.getElementById('header-course-code')
    const currentCourseButton = document.getElementById('current-course-button')

    if (currentCourse) {
        headerCourseCode.innerHTML = currentCourse.courseCode
        currentCourseButton.style.display = 'flex'
        fetchCoursesForDropdown()
    } else {
        currentCourseButton.style.display = 'none'
    }
}

function fetchCoursesForDropdown() {
    const courseDropdownList = document.getElementById('course-dropdown-list');
    courseDropdownList.innerHTML = '';

    database.collection('users').doc(currentUserID).collection('courses').get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            const course = doc.data();
            const courseDropdownItem = createDOMElement('div', 'course-dropdown-item', course.courseCode, courseDropdownList);
            if (currentCourse.id == course.id) {
                courseDropdownItem.className = 'course-dropdown-item-current'
            }
            courseDropdownItem.addEventListener('click', () => {
                localStorage.setItem('currentCourse', JSON.stringify(course));
                updateCourseHeader()
                window.location.reload();
            })
        });

    }).catch(function(error) {
        console.log("Error getting courses:", error);
    });
}



function logout() {
    firebase.auth().signOut().then(() => {
        console.log("User signed out");
        localStorage.removeItem('currentCourse');
        window.location.href = '/login'; 
    }).catch((error) => {
        console.error("Error signing out: ", error);
        const errorText = document.getElementById('auth-error-text');
        errorText.style.display = "block";
        errorText.innerHTML = "There was an issue signing out, please try again later or contact support.";
    });
}



document.addEventListener('DOMContentLoaded', () => {
    const tabs = {
        'dashboard': 'dashboard-tab',
        'course-chat': 'chat-tab',
        'lecture-notes': 'notebook-tab'
    };
    const activeSegment = window.location.pathname.split('/').filter(Boolean).pop();
    const activeTabId = tabs[activeSegment] || 'dashboard-tab';
    Object.values(tabs).forEach(tabId => {
        const tabElement = document.getElementById(tabId);
        tabElement.classList.toggle('dashboard-tab-selected', tabId === activeTabId);
        tabElement.classList.toggle('dashboard-tab', tabId !== activeTabId);
    });
});

function checkSubscriptionStatus(customerID) {
    const banner = document.getElementById('subscription-banner');

    if (!customerID) {
        if (banner) {
            $(banner).fadeIn();
        }
        return;
    }

    fetch('https://courseable-d6c39cc199c5.herokuapp.com/check-subscription-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customer_id: customerID })
    })
    .then(response => response.json())
    .then(data => {

        if (data.subscribed) {
            isSubscribed = true;
            if (banner) {
                banner.style.display = 'none';
            }
        } else {
            isSubscribed = false;
            if (banner) {
                $(banner).fadeIn();
            }
        }
    })
    .catch(error => {
        console.error('Error checking subscription status:', error);
    });
}

