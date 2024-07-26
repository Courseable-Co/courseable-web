
/**
 * Creates a DOM element and appends it to a specified parent element.
 * @param {string} type - The type of the HTML element to create.
 * @param {string} className - The CSS class for the element.
 * @param {string} value - The text content or src for the element.
 * @param {HTMLElement} parent - The parent element to which the new element will be appended.
 */
function createDOMElement(type, className, value, parent) {
    let element = document.createElement(type);
    element.className = className;
    if (type === 'img') {
        element.src = value;
    } else {
        element.textContent = value;
    }
    parent.appendChild(element);
    return element;
}



var currentUserID = ""
var numCourses = 0

document.addEventListener("DOMContentLoaded", function() {
    // Get elements
    const logoutButton = document.getElementById('logout-button');
    const profilePhotoContainer = document.getElementById('profile-photo-container')
    const homeCourseContainer = document.getElementById('home-course-container');
    const deleteCourseModal = $('#delete-course-modal');
    const cancelDeleteCourse = $('#cancel-delete-course');
    const closeDeleteCourseModal = $('#close-delete-course-modal');

    // Initial displays
    profilePhotoContainer.innerHTML = ""
    homeCourseContainer.innerHTML = "";
    document.getElementById('home-view').style.display = 'block'
    
    // Set onclick listeners

    logoutButton.addEventListener("click", logout);

    // Auth state changed event
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUserID = user.uid;

            database.collection('users').doc(currentUserID).get().then(function(doc) {
                if (doc.exists) {
                    const data = doc.data();

                    if (data.profilePhoto) {
                        createDOMElement('img', 'header-profile-photo', data.profilePhoto, profilePhotoContainer)
                    } else {
                        createDOMElement('div', 'default-profile-photo', '', profilePhotoContainer)
                    }

                    fetchCourses();

                } else {
                    console.log("No such document!");
                    createDOMElement('div', 'default-profile-photo', '', profilePhotoContainer)

                }
            }).catch(function(error) {
                console.log("Error getting document:", error);
                errorText.style.display = "block";
                errorText.innerHTML = "There was an issue loading your data, please try again later or contact support.";
            });
        } else {
            window.location.href = '/login'; // Redirect to login if not authenticated
        }
    });

    // Close modal handlers
    closeDeleteCourseModal.on('click', () => {
        deleteCourseModal.fadeOut();
    });

    cancelDeleteCourse.on('click', () => {
        deleteCourseModal.fadeOut();
    });
});

function fetchCourses() {
    const homeCourseContainer = document.getElementById('home-course-container');
    homeCourseContainer.innerHTML = ''; // Clear the container
    const newCourseModal = $('#new-course-modal');
    const addCourseButton = createDOMElement('div', 'add-new-course-button', '', homeCourseContainer);
    createDOMElement('div', 'plus', '+', addCourseButton);

    addCourseButton.addEventListener('click', function() {
        newCourseModal.css('display', 'flex').hide().fadeIn();
        $('#new-course-modal-container').fadeIn();
        resetNewCourseModal()
    });

    database.collection('users').doc(currentUserID).collection('courses').get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            numCourses ++;
            const course = doc.data();
            const courseDiv = createDOMElement('div', 'course-div', '', homeCourseContainer);
            courseDiv.setAttribute('data-course-id', doc.id);
            courseDiv.addEventListener('click', () => {
                loadCourseView(course)
            })

            if (course.backgroundImage) {
                courseDiv.style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.36)), url(${course.backgroundImage})`;
            }

            const courseTextContainerTop = createDOMElement('div', 'course-text-container-top', '', courseDiv);
            createDOMElement('div', 'text-overlay-white', `${new Date(course.startDate).toLocaleDateString()} - ${new Date(course.endDate).toLocaleDateString()}`, courseTextContainerTop);

            const courseMenuDiv = createDOMElement('div', 'course-menu-div', '', courseTextContainerTop);
            const courseEllipsis = createDOMElement('div', 'course-ellipsis', '', courseMenuDiv);
            const courseMenu = createDropdownMenu(courseMenuDiv, course);
            courseMenu.style.display = "none"

            $(courseEllipsis).on('click', function(event) {
                event.stopPropagation();
                $(courseMenu).fadeToggle();
            });

            $(document).on('click', function(event) {
                if (!$(courseMenuDiv).is(event.target) && !$(courseMenuDiv).has(event.target).length) {
                    $(courseMenu).fadeOut();
                }
            });

            const courseTextContainer = createDOMElement('div', 'course-text-container', '', courseDiv);
            const courseTextDiv = createDOMElement('div', 'course-text-div', '', courseTextContainer);
            createDOMElement('div', 'course-code', course.courseCode, courseTextDiv);
            createDOMElement('div', 'course-title', course.courseTitle, courseTextDiv);
            createDOMElement('div', 'course-chevron', '', courseTextContainer);
        });

    }).catch(function(error) {
        console.log("Error getting courses:", error);
    });
}

function createDropdownMenu(parent, course) {
    const courseMenu = createDOMElement('div', 'course-menu', '', parent);
    
    const deleteItem = createDOMElement('div', 'course-menu-item', '', courseMenu);
    createDOMElement('div', 'course-menu-icon', '', deleteItem);
    createDOMElement('div', 'course-menu-text', 'Delete', deleteItem);
    deleteItem.addEventListener('click', function(event) {
        event.stopPropagation();
        const courseDiv = parent.closest('.course-div');
        const courseId = courseDiv.getAttribute('data-course-id');
        showDeleteCourseModal(courseId, courseDiv, course);
    });

    const changeBackgroundItem = createDOMElement('div', 'course-menu-item', '', courseMenu);
    createDOMElement('div', 'course-menu-icon', '', changeBackgroundItem);
    createDOMElement('div', 'course-menu-text', 'Change Background', changeBackgroundItem);

    return courseMenu;
}

function showDeleteCourseModal(courseId, courseDiv, course) {
    const deleteCourseModal = $('#delete-course-modal');
    const deleteCourseButton = $('#delete-course-button');
    document.getElementById('delete-course-div').style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.36)), url(${course.backgroundImage})`;
    document.getElementById('delete-course-startEnd').innerHTML = `${new Date(course.startDate).toLocaleDateString()} - ${new Date(course.endDate).toLocaleDateString()}`;
    document.getElementById('delete-course-courseCode').innerHTML = course.courseCode;
    document.getElementById('delete-course-courseTitle').innerHTML = course.courseTitle;

    deleteCourseModal.css('display', 'flex').hide().fadeIn();

    deleteCourseButton.off('click').on('click', function() {
        deleteCourse(courseId, courseDiv);
        deleteCourseModal.fadeOut();
    });
}

function deleteCourse(courseId, courseDiv) {
    database.collection('users').doc(currentUserID).collection('courses').doc(courseId).delete().then(function() {
        $(courseDiv).fadeOut(function() {
            courseDiv.remove();
        });
    }).catch(function(error) {
        console.error("Error removing course: ", error);
    });
}

function logout() {
    firebase.auth().signOut().then(() => {
        console.log("User signed out");
        window.location.href = '/login'; // Redirect to login page or any other page after logout
    }).catch((error) => {
        console.error("Error signing out: ", error);
        const errorText = document.getElementById('auth-error-text');
        errorText.style.display = "block";
        errorText.innerHTML = "There was an issue signing out, please try again later or contact support.";
    });
}