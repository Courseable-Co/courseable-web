

function fetchCourseMaterials(courseId) {
    //Load Course Documents
    listenToCourseDocuments(courseId)

    const userRef = database.collection('users').doc(currentUserID);
    const courseRef = userRef.collection('courses').doc(courseId);
    const courseMaterialsContainer = document.getElementById('course-materials-container');
    courseMaterialsContainer.innerHTML = ''; // Clear previous content



    Promise.all([
        courseRef.collection('practiceExams').get(),
        courseRef.collection('studyGuides').get()
    ]).then(([examsSnapshot, guidesSnapshot]) => {
        let documents = [];

        examsSnapshot.forEach(doc => {
            const exam = doc.data();
            exam.id = doc.id;
            exam.type = 'practiceExam';
            documents.push(exam);
        });

        guidesSnapshot.forEach(doc => {
            const guide = doc.data();
            guide.id = doc.id;
            guide.type = 'studyGuide';
            documents.push(guide);
        });

        // Sort documents by date created
        documents.sort((a, b) => b.created.toMillis() - a.created.toMillis());

        documents.forEach(doc => buildDocumentPreview(doc, courseMaterialsContainer));
    }).catch(error => {
        console.error("Error fetching course materials:", error);
    });
}

function buildDocumentPreview(document, container) {
    const preview = createDOMElement('div', 'document-preview-container', '', container);
    preview.addEventListener('click', () => {
        if (document.type === 'practiceExam') {
            showExamView(document);
        } else if (document.type === 'studyGuide') {
            showStudyGuideView(document, document.id);
        }
    });

    // Top section
    const topSection = createDOMElement('div', 'document-preview-top', '', preview);
    createDOMElement('div', 'course-material-icon', document.type === 'practiceExam' ? '🗒️' : '📘', topSection);
    createDOMElement('div', 'preview-ellipsis', '', topSection);

    const timestamp = document.created.toDate();
    const formattedDate = timestamp.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const numItems = Array.isArray(document.problems) ? document.problems.length : 0;

    // Bottom section
    const bottomSection = createDOMElement('div', 'document-preview-bottom', '', preview);
    createDOMElement('div', 'course-material-title', document.type === 'practiceExam' ? "Practice Exam" : "Study Guide", bottomSection);
    createDOMElement('div', 'course-material-subtitle', `${formattedDate} - ${numItems} Items`, bottomSection);
}

function createDOMElement(type, className, innerHTML, parent) {
    const element = document.createElement(type);
    element.className = className;
    element.innerHTML = innerHTML;
    if (parent) {
        parent.appendChild(element);
    }
    return element;
}

// This example assumes that you have functions to show views specific to the documents
function showExamView(exam) {
    $('#create-exam-modal').css('display', 'flex').hide().fadeIn();
    displayExamData(exam)
}

function showStudyGuideView(guide) {

    const db = firebase.firestore();
    const user_id = firebase.auth().currentUser.uid;
    const course_id = currentCourse.id;

    db.collection('users').doc(user_id).collection('courses').doc(course_id).collection('studyGuides').doc(guide.id).get()
    .then(doc => {
        if (doc.exists) {
            $('#study-guides-view').css('display', 'flex').hide().fadeIn();
            buildStudyGuide(doc.data().studyGuide);
        } else {
            console.error('No such study guide!');
        }
    })
    .catch(error => {
        console.error('Error fetching study guide:', error);
    });
}




//==================== Course Documents ==================================
function listenToCourseDocuments(courseId) {
    // Reference to the user's specific course
    const userRef = firebase.firestore().collection('users').doc(currentUserID);
    const courseRef = userRef.collection('courses').doc(courseId);

    // Reference to the container where documents will be displayed
    const courseDocumentsContainer = document.getElementById('course-documents-container');
    courseDocumentsContainer.innerHTML = ''; // Clear previous content

    // Set up a real-time listener for the courseDocuments subcollection
    courseRef.collection('documents').onSnapshot(snapshot => {
        courseDocumentsContainer.innerHTML = ''; // Clear existing documents before re-rendering

        let documents = [];

        snapshot.forEach(doc => {
            const documentData = doc.data();
            documentData.id = doc.id; // Capture the document ID if needed for further operations
            documents.push(documentData);
        });

        // Optional: Sort documents by date created if a 'created' timestamp is available
        documents.sort((a, b) => (b.created?.toDate() - a.created?.toDate()));

        // Display each document in the UI
        documents.forEach(doc => {
            buildDocumentCard(doc, courseDocumentsContainer);
        });
    }, error => {
        console.error("Error listening to course documents:", error);
    });
}


function buildDocumentCard(doc, container) {
    const docPreview = createDOMElement('div', 'document-preview', '', container);

    let documentPreviewHeader = createDOMElement('div', 'document-preview-header', '', docPreview)
    let previewMenu = createDOMElement('div', 'preview-menu-div', '', documentPreviewHeader);
    let documentMenuButton = createDOMElement('div', 'preview-ellipsis', '', previewMenu);
    const documentMenu = createDocumentDropdownMenu(previewMenu, doc);
    documentMenu.style.display = "none"


    $(documentMenuButton).on('click', function(event) {
        event.stopPropagation();
        $(documentMenu).fadeToggle();
    });

    // Clicking outside the menu should close it if it's open
    $(document).on('click', function(event) {
        if (!$(event.target).closest('.preview-menu-div').length) {
            $(documentMenu).fadeOut();
        }
    });


    let documentPreviewContentDiv = createDOMElement('div', 'document-preview-content-div', '', docPreview)
    createDOMElement('div', 'document-preview-title', doc.documentTitle, documentPreviewContentDiv);
    createDOMElement('div', 'document-preview-subtitle', doc.fileName, documentPreviewContentDiv);

    docPreview.addEventListener('click', () => {
        $('#upload-documents-modal').css('display', 'flex').hide().fadeIn();
        showAnalysisResults(doc)
    })
}

function createDocumentDropdownMenu(parent, document) {
    const docMenu = createDOMElement('div', 'course-menu', '', parent);
    
    const deleteItem = createDOMElement('div', 'course-menu-item', '', docMenu);
    createDOMElement('div', 'course-menu-icon', '', deleteItem);
    createDOMElement('div', 'course-menu-text', 'Delete', deleteItem);
    deleteItem.addEventListener('click', function(event) {
        event.stopPropagation();
        deleteCourseDocument(currentUserID, currentCourse.id, document.id);

    });

    const changeBackgroundItem = createDOMElement('div', 'course-menu-item', '', docMenu);
    createDOMElement('div', 'course-menu-icon', '', changeBackgroundItem);
    const openFileButton = createDOMElement('div', 'course-menu-text', 'Open File', changeBackgroundItem);
    openFileButton.addEventListener('click', (event) => {
        event.stopPropagation();  // Prevent this click from propagating to the document preview
        window.open(document.url, '_blank');
    });

    return docMenu;
}

function deleteCourseDocument(user_id, course_id, document_id) {
    const docRef = firebase.firestore()
        .collection('users').doc(user_id)
        .collection('courses').doc(course_id)
        .collection('documents').doc(document_id);

    docRef.delete().then(() => {
        console.log('Document successfully deleted!');
        // Optionally, refresh the document list or give user feedback
    }).catch((error) => {
        console.error("Error removing document: ", error);
    });
}