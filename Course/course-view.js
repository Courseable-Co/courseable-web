//
//
// course-view.js
// Author: Adrian Martushev
// Date Created : July 2nd, 2024
// Property of Courseable.co
//
//

document.addEventListener("DOMContentLoaded", function() {
    const backHome = document.getElementById('back-home');
    const createExamButton = document.getElementById('create-exam-button');
    const closeExamModal = document.getElementById('close-exam-modal');

    //Initial displays
    document.getElementById('all-tutors-container').innerHTML = ''
    document.getElementById('course-people-container').innerHTML = ''

    //Course Buttons
    const lectureNotesButton = document.getElementById('lecture-notes-button')
    lectureNotesButton.addEventListener('click', () => {
        if (currentCourse) {
            window.location.href = `/lecture-notes?courseID=${currentCourse.id}`;
        } else {
            console.error("courseID is not available.");
        }
    });
    const studyGuidesButton = document.getElementById('study-guides-button')
    studyGuidesButton.addEventListener('click', () => {
        showStudyGuidesInitialView()
    })

    const documentsButton = document.getElementById('documents-button')
    documentsButton.addEventListener('click', () => {
        showUploadDocuments()
    })

    const courseChatButton = document.getElementById('course-chat-button')
    courseChatButton.addEventListener('click', () => {
        window.location.href = '/course-chat'; 
    })

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) { //Wait for auth state to load, ensures currentUserID is available
            // Retrieve course data from local storage
            const currentCourse = JSON.parse(localStorage.getItem('currentCourse'));
            if (currentCourse) {
                loadCourseView(currentCourse);
            } else {
                console.error("No course data found in local storage.");
            }
        }
    })


    // Event listener for back button
    backHome.addEventListener('click', () => {window.location.href = "/dashboard"});
    createExamButton.addEventListener('click', createPracticeExam);
    closeExamModal.addEventListener('click', hideExamModal)
});

function loadCourseView(course) {
    const courseViewCourseCode = document.getElementById('course-view-courseCode');
    const courseViewCourseTitle = document.getElementById('course-view-courseTitle');
    const courseSummaryText = document.getElementById('course-summary-text')
    const learningObjectivesList = document.getElementById('learning-objectives-list')

    currentCourse = course;

    fetchCoursesAndMatchCourseCode(currentCourse.schoolCode, currentCourse.courseCode)

    // Set course details
    courseViewCourseCode.innerHTML = course.courseCode;
    courseViewCourseTitle.innerHTML = course.courseTitle;
    courseSummaryText.innerHTML = course.courseSummary;
    learningObjectivesList.innerHTML = '';

    fetchCourseMaterials(course.id);

    // Create a new list item for each learning objective
    course.learningObjectives.forEach(function(objective) {
        const listItemDiv = createDOMElement('div', 'list-item-div', '', learningObjectivesList);
        createDOMElement('div', 'icon-unfilled', '', listItemDiv)
        createDOMElement('div', 'list-item-text', objective, listItemDiv);

        createDOMElement('button', 'list-item-button', 'Study', listItemDiv);
        createDOMElement('button', 'list-item-button', 'Practice', listItemDiv);
    });

}

function hideExamModal() {
    $('#create-exam-modal').fadeOut();
}

function createPracticeExam() {
    $('#create-exam-modal').css('display', 'flex').hide().fadeIn();
    $('#loading-exam-div').css('display', 'flex').hide().fadeIn();

    var examContent = $('#exam-content-columns');
    examContent.hide(); 

    var formData = new FormData();
    formData.append('learningObjectives', JSON.stringify(currentCourse.learningObjectives));
    formData.append('userID', currentUserID);
    formData.append('courseID', currentCourse.id);

    fetch('https://courseable-d6c39cc199c5.herokuapp.com/createPracticeExam', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        $('#loading-exam-div').fadeOut(() => {
            examContent.fadeIn();
            displayExamData(data); 
        });
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });
}



function showExamView(exam) {
    $('#create-exam-modal').css('display', 'flex').hide().fadeIn();
    $('#loading-exam-div').hide(); 

    var examContent = $('#exam-content-columns');
    examContent.show(); 
    displayExamData(exam)
}



function normalizeCourseCode(courseCode) {
    return courseCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function fetchCoursesAndMatchCourseCode(schoolCode, courseCode) {
    const url = `https://tutortree-api-348d36f0f69e.herokuapp.com/api/fetchSubjectsAndCourses?schoolID=${schoolCode}`;
    const normalizedInputCode = normalizeCourseCode(courseCode);

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.subjects_and_courses) {
                const subjectsAndCourses = data.subjects_and_courses;
                let matchFound = false;
                let matchedSubject = '';
                let matchedCourseCode = '';

                // Iterate through subjects and courses
                for (let subject in subjectsAndCourses) {
                    for (let course of subjectsAndCourses[subject]) {
                        if (normalizeCourseCode(course) === normalizedInputCode) {
                            console.log(`Match found: ${course} in ${subject}`);
                            matchFound = true;
                            matchedSubject = subject;
                            matchedCourseCode = course; // Use the exact course code from the API
                            break;
                        }
                    }
                    if (matchFound) break;
                }

                if (matchFound) {
                    // Fetch tutors for the matched course and subject
                    fetchTutorsForCourse(schoolCode, matchedSubject, matchedCourseCode);
                } else {
                    console.log("No reasonable match found for the given course code.");
                }
            } else {
                console.log("No 'subjects_and_courses' key found in the response.");
            }
        })
        .catch(error => {
            console.error('Failed to fetch courses:', error);
        });
}

function fetchTutorsForCourse(schoolCode, subject, courseCode) {
    const url = `https://tutortree-api-348d36f0f69e.herokuapp.com/api/fetchTutorsForCourse?schoolID=${schoolCode}&subject=${encodeURIComponent(subject)}&courseCode=${encodeURIComponent(courseCode)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch tutors');
            }
            return response.json();
        })
        .then(data => {
            if (data.tutors && data.tutors.length > 0) {
                console.log('Tutors for the course:', data.tutors);
                data.tutors.forEach(tutorID => fetchAndDisplayTutor(tutorID));

            } else {
                console.log('No tutors found for this course.');
            }
        })
        .catch(error => {
            console.error('Error fetching tutors:', error);
        });
}


function fetchAndDisplayTutor(tutorID) {
    const url = `https://tutortree-api-348d36f0f69e.herokuapp.com/api/fetchTutor?tutorID=${tutorID}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch tutor information');
            }
            return response.json();
        })
        .then(data => {
            if (data) {
                displayTutorInformation(data);
            } else {
                console.log('No data found for tutor.');
            }
        })
        .catch(error => {
            console.error('Error fetching tutor information:', error);
        });
}

function displayTutorInformation(tutor) {

    const tutorContainer = createDOMElement('div', 'tutor-container', '', document.getElementById('all-tutors-container'));
    const profilePhoto = createDOMElement('img', 'user-profile-photo', tutor.profileImage, tutorContainer);
    const tutorInfoDiv = createDOMElement('div', 'tutor-info-div', '', tutorContainer);
    const personTitle = createDOMElement('div', 'person-title', tutor.name, tutorInfoDiv);
    const personHeader = createDOMElement('div', 'person-header', tutor.major, tutorInfoDiv);
    // const personSubheader = createDOMElement('div', 'person-subheader', tutor.bio, divBlock);
    // const price = createDOMElement('div', 'person-subheader', `Price per hour: $${tutor.pricePHH}`, divBlock);
}