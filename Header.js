
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

document.addEventListener("DOMContentLoaded", function() {
    // Get elements
    const logoutButton = document.getElementById('logout-button');
    const profilePhotoContainer = document.getElementById('profile-photo-container')

    // Initial displays
    profilePhotoContainer.innerHTML = ""
    updateCourseHeader()

    // Set onclick listeners
    logoutButton.addEventListener("click", logout);

    // Auth state changed event
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUserID = user.uid;
            console.log(currentUserID)
            database.collection('users').doc(currentUserID).get().then(function(doc) {
                if (doc.exists) {
                    const data = doc.data();

                    if (data.profilePhoto) {
                        createDOMElement('img', 'header-profile-photo', data.profilePhoto, profilePhotoContainer)
                    } else {
                        createDOMElement('div', 'default-profile-photo', '', profilePhotoContainer)
                    }

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
    currentCourse = JSON.parse(localStorage.getItem('currentCourse'));

    if (currentCourse) {
        headerCourseCode.innerHTML = currentCourse.courseCode
        currentCourseButton.style.display = 'flex'
    } else {
        currentCourseButton.style.display = 'none'
    }
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

    // Extract the last non-empty segment of the URL path
    const activeSegment = window.location.pathname.split('/').filter(Boolean).pop();

    // Determine the active tab ID, default to 'dashboard-tab' if no matching segment
    const activeTabId = tabs[activeSegment] || 'dashboard-tab';

    // Switch tabs
    Object.values(tabs).forEach(tabId => {
        const tabElement = document.getElementById(tabId);
        tabElement.classList.toggle('tab-selected', tabId === activeTabId);
        tabElement.classList.toggle('tab-unselected', tabId !== activeTabId);
    });
});