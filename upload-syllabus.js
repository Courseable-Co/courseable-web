
var backgroundArt = {
    'art-1' : 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/course_backgrounds%2Fart-9.jpeg?alt=media&token=3e9275a4-7265-429c-ae0f-e3973ddf618d',
    'art-2' : 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/course_backgrounds%2Fart-6.jpeg?alt=media&token=9c2e39c3-f0f8-468a-8ff9-8ad72ae6e30a',
    'art-3' : 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/course_backgrounds%2Fart-3.jpeg?alt=media&token=40e4fbdc-8be1-45d8-b9b8-4d83f8848576',
    'art-4' : 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/course_backgrounds%2Fart-7.jpeg?alt=media&token=29089148-5498-497c-8421-cb55cc2c6e7b',
    'art-5' : 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/course_backgrounds%2Fart-4.jpeg?alt=media&token=e626ef00-c587-4893-bd2b-b697ffac3013',
    'art-6' : 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/course_backgrounds%2Fart-5.jpeg?alt=media&token=e9059346-b777-4ba4-8e08-502847f8b23c',
    'art-7' : 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/course_backgrounds%2Fart-3.jpeg?alt=media&token=40e4fbdc-8be1-45d8-b9b8-4d83f8848576',
    'art-8' : 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/course_backgrounds%2Fart-2.jpeg?alt=media&token=280452bc-d19f-4ddd-a3dd-810dbb266eef',
    'art-9' : 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/course_backgrounds%2Fart-10.jpeg?alt=media&token=436897f9-4b96-49de-b50e-6f61362aa915',
    'art-10' : 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/course_backgrounds%2Fart-1.jpeg?alt=media&token=c9dcce9a-7780-4009-817d-3d744ed754a0'
}



document.addEventListener("DOMContentLoaded", function() {
    const fileInput = document.getElementById('fileInput');
    const uploadSyllabus = document.getElementById('upload-syllabus');
    const createCourseButton = document.getElementById('create-course-button')
    createCourseButton.className = "create-course-button-inactive"
    const syllabusTextField = $('#syllabus-text-field');

    const loadingCourseModal = $('#loading-course-modal')
    const closeNewCourseButton = document.getElementById('close-new-course-modal');
    const newCourseModal = $('#new-course-modal');


    //Set initial displays
    resetNewCourseModal()

    closeNewCourseButton.addEventListener('click', () => {
        newCourseModal.fadeOut()
    });

    uploadSyllabus.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        var file = fileInput.files[0];
        if (file) {
            uploadFile(file);
        }
    });

    uploadSyllabus.addEventListener('dragover', function(event) {
        event.preventDefault();
        uploadSyllabus.style.borderColor = '#5956d6';
    });

    uploadSyllabus.addEventListener('dragleave', function() {
        uploadSyllabus.style.borderColor = '#3d3d3d';
    });

    uploadSyllabus.addEventListener('drop', function(event) {
        event.preventDefault();
        uploadSyllabus.style.borderColor = '#5956d6';
        var file = event.dataTransfer.files[0];
        if (file) {
            uploadFile(file);
        }
    });

    // Monitor changes to the syllabus text field
    syllabusTextField.on('input', function() { 
        if (syllabusTextField.val().trim() !== '') { 
            createCourseButton.className = "create-course-button-active";
        } else {
            createCourseButton.className = "create-course-button-inactive";
        }
    });

    createCourseButton.addEventListener('click', function() {
        const syllabusText = syllabusTextField.val().trim();
        if (syllabusText !== '') {
            uploadSyllabusText(syllabusText);
        }
    });


    document.getElementById('go-to-course-button').addEventListener('click', () => {
        newCourseModal.fadeOut()
        loadCourseView(currentCourse)
    })

    document.getElementById('add-another-course-button').addEventListener('click', () => {
        $('#loading-course-modal').fadeOut(function() {
            $('#new-course-modal-container').fadeIn();
            resetNewCourseModal()

        });
    })
});



function uploadFile(file) {
    $('#new-course-modal-container').fadeOut(function() {
        $('#loading-course-modal').fadeIn();
    });

    document.getElementById('loading-syllabus-div').style.display = "flex";
    document.getElementById('course-loaded-container').style.display = "none";

    var formData = new FormData();
    formData.append('file', file);
    formData.append('userID', currentUserID);

    const backgroundIndex = (numCourses % 10) + 1;
    formData.append('backgroundImage', backgroundArt['art-' + backgroundIndex]);

    fetch('https://courseable-d6c39cc199c5.herokuapp.com/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchCourses()

        // Extract and clean up the JSON response
        const jsonResponse = data.response;
        const currentDate = new Date().toLocaleDateString();
        document.getElementById('new-course-div').style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.36)), url(${jsonResponse.backgroundImage})`;

        document.getElementById('course-loaded-courseCode').innerHTML = jsonResponse.courseCode || "N/A";
        document.getElementById('course-loaded-courseTitle').innerHTML = jsonResponse.courseTitle || "N/A";

        let startDate = jsonResponse.startDate ? new Date(jsonResponse.startDate).toLocaleDateString() : currentDate
        let endDate = new Date(jsonResponse.endDate).toLocaleDateString()
        document.getElementById('course-loaded-startEnd').innerHTML = `${startDate} ${jsonResponse.endDate ? " - " + endDate : ""}`;

        currentCourse = jsonResponse //Set global course for navigation
        $('#loading-syllabus-div').fadeOut(function() {
            $('#course-loaded-container').fadeIn();
        });

    })
    .catch((error) => {
        console.error('Error:', error);
    });
}



function uploadSyllabusText(syllabusText) {
    $('#new-course-modal-container').fadeOut(function() {
        $('#loading-course-modal').fadeIn();
    });

    document.getElementById('loading-syllabus-div').style.display = "flex";
    document.getElementById('course-loaded-container').style.display = "none";

    var formData = new FormData();
    formData.append('syllabusText', syllabusText);
    formData.append('userID', currentUserID);
    const backgroundIndex = (numCourses % 10) + 1;
    formData.append('backgroundImage', backgroundArt['art-' + backgroundIndex]);

    fetch('https://courseable-d6c39cc199c5.herokuapp.com/uploadText', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchCourses()
        // Extract and clean up the JSON response
        const jsonResponse = data.response;
        const currentDate = new Date().toLocaleDateString();

        document.getElementById('course-loaded-courseCode').innerHTML = jsonResponse.courseCode || "N/A";
        document.getElementById('course-loaded-courseTitle').innerHTML = jsonResponse.courseTitle || "N/A";
        document.getElementById('course-loaded-startEnd').innerHTML = 
        `${jsonResponse.startDate ? new Date(jsonResponse.startDate).toLocaleDateString() : currentDate} - ${jsonResponse.endDate ? new Date(jsonResponse.endDate).toLocaleDateString() : currentDate}`;

        currentCourse = jsonResponse //Set global course for navigation
        $('#loading-syllabus-div').fadeOut(function() {
            $('#course-loaded-container').fadeIn();
        });

    })
    .catch((error) => {
        console.error('Error:', error);
    });
}



function resetNewCourseModal() {
    // Reset file input
    document.getElementById('fileInput').value = '';

    // Reset syllabus text field
    $('#syllabus-text-field').val('');

    // Reset course details
    document.getElementById('course-loaded-courseCode').innerHTML = "";
    document.getElementById('course-loaded-courseTitle').innerHTML = "";
    document.getElementById('course-loaded-startEnd').innerHTML = "";

    // Reset button classes
    document.getElementById('create-course-button').className = "create-course-button-inactive";

    // Hide or reset other elements as needed
    $('#loading-course-modal').css('display', 'none');
    $('#loading-syllabus-div').css('display', 'none');
    $('#course-loaded-container').css('display', 'none');
}