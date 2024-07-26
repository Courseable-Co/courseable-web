//
//
// course-view.js
// Author: Adrian Martushev
// Date Created : July 2nd, 2024
// Property of Courseable.co
//
//



let currentCourse = null;

document.addEventListener("DOMContentLoaded", function() {
    const backHome = document.getElementById('back-home');
    const createExamButton = document.getElementById('create-exam-button');
    const closeExamModal = document.getElementById('close-exam-modal');

    //Course Buttons
    const lectureNotesButton = document.getElementById('lecture-notes-button')
    lectureNotesButton.addEventListener('click', () => {
        if (currentCourse) {
            window.location.href = `/lecture-notes?courseID=${currentCourse.id}`;
        } else {
            console.error("courseID is not available.");
        }
    });

    const courseChatButton = document.getElementById('course-chat-button')
    courseChatButton.addEventListener('click', () => {
        window.location.href = '/course-chat'; 
    })

    // Initially hide the course view
    $('#course-view').hide();

    // Event listener for back button
    backHome.addEventListener('click', hideCourseView);

    createExamButton.addEventListener('click', createPracticeExam);
    closeExamModal.addEventListener('click', hideExamModal)
});

function loadCourseView(course) {
    const courseViewCourseCode = document.getElementById('course-view-courseCode');
    const courseViewCourseTitle = document.getElementById('course-view-courseTitle');
    const courseSummaryText = document.getElementById('course-summary-text')
    const learningObjectivesList = document.getElementById('learning-objectives-list')

    currentCourse = course;

    // Fade out home view and fade in course view
    $('#home-view').fadeOut(500, function() {
        $('#course-view').fadeIn(500);
    });

    // Set course details
    courseViewCourseCode.innerHTML = course.courseCode;
    courseViewCourseTitle.innerHTML = course.courseTitle;
    courseSummaryText.innerHTML = course.courseSummary;
    learningObjectivesList.innerHTML = '';

    fetchPracticeExams(course.id);

    // Create a new list item for each learning objective
    course.learningObjectives.forEach(function(objective) {
        const listItemDiv = createDOMElement('div', 'list-item-div', '', learningObjectivesList);
        createDOMElement('div', 'icon-unfilled', '', listItemDiv)
        createDOMElement('div', 'list-item-text', objective, listItemDiv);

        createDOMElement('button', 'list-item-button', 'Study', listItemDiv);
        createDOMElement('button', 'list-item-button', 'Practice', listItemDiv);
    });

}

function hideCourseView() {
    // Fade out course view and fade in home view
    $('#course-view').fadeOut(500, function() {
        $('#home-view').fadeIn(500);
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


/**
 * Fetches and displays practice exams for a specific course.
 * @param {string} courseId - The ID of the course.
 */
function fetchPracticeExams(courseId) {
    const userRef = database.collection('users').doc(currentUserID);
    userRef.collection('courses').doc(courseId).collection('practiceExams')
    .get()
    .then(function(querySnapshot) {
        const courseMaterialsContainer = document.getElementById('course-materials-container')
        courseMaterialsContainer.innerHTML = ''; // Clear previous content

        if (!querySnapshot.empty) {
            querySnapshot.forEach(function(doc) {
                const exam = doc.data();
                buildExamPreview(exam, courseMaterialsContainer);
            });
        } else {
            console.log("No practice exams found for this course.");
        }
    })
    .catch(function(error) {
        console.error("Error fetching practice exams:", error);
    });
}


function buildExamPreview(exam, container) {
    const examPreview = createDOMElement('div', 'exam-preview-container', '', container);
    examPreview.addEventListener('click', () => showExamView(exam));
    
    // Top section
    const examTop = createDOMElement('div', 'exam-preview-top', '', examPreview);
    createDOMElement('div', 'course-material-icon', '🗒️', examTop);
    createDOMElement('div', 'preview-ellipsis', '', examTop);

    const timestamp = exam.created;
    const date = timestamp.toDate();
    const formattedDate = date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const numProblems = Array.isArray(exam.problems) ? exam.problems.length : 0;

    // Bottom section
    const examBottom = createDOMElement('div', 'exam-preview-bottom', '', examPreview);
    createDOMElement('div', 'course-material-title', "Practice Exam", examBottom);
    createDOMElement('div', 'course-material-subtitle', `${formattedDate} - ${numProblems} Problems`, examBottom);
}

function showExamView(exam) {
    $('#create-exam-modal').css('display', 'flex').hide().fadeIn();
    $('#loading-exam-div').hide(); 

    var examContent = $('#exam-content-columns');
    examContent.show(); 
    displayExamData(exam)
}

