

// Function to show the initial view of the study guide modal
function showStudyGuidesInitialView() {
    // Set the display to flex directly via CSS before starting the fade in
    $('#study-guides-view').css('display', 'flex').hide().fadeIn();
    
    // Adjust other elements' display properties
    $('#study-guide-initial-view').css('display', 'block');
    $('#submit-study-guide-div').css('display', 'block');
    $('#generating-study-guide').css('display', 'none');
    $('#study-guide-result-view').css('display', 'none');
    
    // Set placeholder text for comments
    $('#study-guide-comments').attr('placeholder', 'Add anything relevant - eg "Don\'t include integration by parts", or "The final only covers topics from the last midterm on"');
}


document.addEventListener("DOMContentLoaded", function() {
    const studyGuidesView = document.getElementById('study-guides-view');
    const closeStudyGuideModal = document.getElementById('close-study-guide-modal');
    const closeStudyGuideCompleteModal = document.getElementById('close-study-guide-complete-modal')
    const submitStudyGuideDiv = document.getElementById('submit-study-guide-div');
    const createStudyGuideButton = document.getElementById('create-study-guide-button');
    const studyGuideComments = document.getElementById('study-guide-comments');
    const generatingStudyGuideView = document.getElementById('generating-study-guide');
    const studyGuideResultView = document.getElementById('study-guide-result-view');

    function showLoadingView() {
        submitStudyGuideDiv.style.display = 'none';
        generatingStudyGuideView.style.display = 'flex';
        studyGuideResultView.style.display = 'none';
    }

    function generateStudyGuide() {
        const learningObjectives = currentCourse.learningObjectives;
        const syllabus = currentCourse.syllabus;
        const userId = firebase.auth().currentUser.uid;
        const courseId = currentCourse.id;
    
        const additionalComments = studyGuideComments.value;
        showLoadingView();
    
        const formData = new FormData();
        formData.append('learningObjectives', JSON.stringify(learningObjectives)); // Convert array to JSON string
        formData.append('syllabus', syllabus);
        formData.append('additionalComments', additionalComments);
        formData.append('userID', userId);
        formData.append('courseID', courseId);
    
        fetch('https://courseable-d6c39cc199c5.herokuapp.com/createStudyGuide', {
            method: 'POST',
            body: formData 
        })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                console.error('Error:', result.error);
            } else {
                console.log('Success:', result);
                fetchStudyGuideFromFirebase(result.studyGuideId);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    // Event bindings for buttons
    createStudyGuideButton.addEventListener('click', generateStudyGuide);
    closeStudyGuideModal.addEventListener('click', () => {
        studyGuideComments.value = '';
        showStudyGuidesInitialView();
        $(studyGuidesView).fadeOut();
    });

    closeStudyGuideCompleteModal.addEventListener('click', () => {
        studyGuideComments.value = '';
        showStudyGuidesInitialView();
        $(studyGuidesView).fadeOut();
    });

    document.getElementById('print-study-guide').addEventListener('click', printStudyGuide)
    document.getElementById('download-study-guide').addEventListener('click', printStudyGuide)
});

// Function to fetch the study guide from Firebase and build it
function fetchStudyGuideFromFirebase(studyGuideId) {
    const db = firebase.firestore();
    const user_id = firebase.auth().currentUser.uid;
    const course_id = currentCourse.id;

    db.collection('users').doc(user_id).collection('courses').doc(course_id).collection('studyGuides').doc(studyGuideId).get()
    .then(doc => {
        if (doc.exists) {
            console.log('Study Guide fetched successfully:', doc.data());
            buildStudyGuide(doc.data().studyGuide);
        } else {
            console.error('No such study guide!');
        }
    })
    .catch(error => {
        console.error('Error fetching study guide:', error);
    });
}

//=====================================Build and Display the Study Guide ====================================

function buildStudyGuide(studyGuide) {
    $('#study-guide-initial-view').hide();
    $('#generating-study-guide').hide();
    $('#study-guide-result-view').css('display', 'flex');

    document.getElementById('study-guide-previews-container').innerHTML = '';

    const studyContentContainer = document.getElementById('study-content-container');
    studyContentContainer.innerHTML = '';

    let pageContent = createNewPage(studyContentContainer);
    let currentPageHeight = 0;
    const maxPageHeight = 700; 

    studyGuide.forEach((objective, index) => {
        const objectiveSection = createDOMElement('div', 'study-guide-objective', '', null);
        createDOMElement('div', 'study-guide-header', objective.objective, objectiveSection);
        createDOMElement('p', 'study-guide-summary', objective.summary, objectiveSection);
        appendLists(objective, objectiveSection);

        pageContent.appendChild(objectiveSection); 
        const sectionHeight = calculateTotalHeight(objectiveSection);

        if (currentPageHeight + sectionHeight > maxPageHeight) {
            pageContent.removeChild(objectiveSection);
            pageContent = createNewPage(studyContentContainer);
            pageContent.appendChild(objectiveSection);
            currentPageHeight = sectionHeight;
        } else {
            currentPageHeight += sectionHeight;
        }
    });

    createPreviewsForAllPages(studyContentContainer);
    document.getElementById('study-guide-title').innerHTML = `${currentCourse.courseCode}-study-guide.pdf`
    const pages = studyContentContainer.getElementsByClassName('page-content')
    document.getElementById('study-guide-page-count').innerHTML = `${pages.length} Pages`

}

function createNewPage(container) {
    const newPage = document.createElement('div');
    newPage.className = 'page-content';
    container.appendChild(newPage);
    return newPage;
}

function calculateTotalHeight(element) {
    return element.offsetHeight + parseInt(window.getComputedStyle(element).marginTop) + parseInt(window.getComputedStyle(element).marginBottom);
}

function appendLists(objective, objectiveSection) {
    if (objective.keyConcepts && objective.keyConcepts.length > 0) {
        createDOMElement('div', 'study-guide-subheader', 'Key Concepts', objectiveSection);
        const keyConceptsList = createDOMElement('ul', 'study-guide-list', '', objectiveSection);
        objective.keyConcepts.forEach(concept => {
            createDOMElement('li', 'study-guide-list-item', concept, keyConceptsList);
        });
    }

    if (objective.importantFormulas && objective.importantFormulas.length > 0) {
        createDOMElement('div', 'study-guide-subheader', 'Important Formulas', objectiveSection);
        const formulasList = createDOMElement('ul', 'study-guide-list', '', objectiveSection);
        objective.importantFormulas.forEach(formula => {
            createDOMElement('li', 'study-guide-list-item', formula, formulasList);
        });
    }

    if (objective.exampleProblems && objective.exampleProblems.length > 0) {
        createDOMElement('div', 'study-guide-subheader', 'Example Problems', objectiveSection);
        const problemsList = createDOMElement('ul', 'study-guide-list', '', objectiveSection);
        objective.exampleProblems.forEach(problem => {
            createDOMElement('li', 'study-guide-list-item', problem, problemsList);
        });
    }
}


function createPreviewsForAllPages(container) {
    const pages = container.getElementsByClassName('page-content');
    Array.from(pages).forEach((page, index) => {
        createPagePreview(page, index + 1);
    });
}

function createPagePreview(pageContent, pageNumber) {
    const previewsContainer = document.getElementById('study-guide-previews-container');
    const previewDiv = document.createElement('div');
    previewDiv.className = 'page-preview-div';

    const clonedContent = cloneContentWithPreviewClass(pageContent);
    previewDiv.appendChild(clonedContent);

    const previewNumber = document.createElement('div');
    previewNumber.className = 'page-preview-number';
    previewNumber.textContent = `Page ${pageNumber}`;
    previewDiv.appendChild(previewNumber);

    previewsContainer.appendChild(previewDiv);
}

function cloneContentWithPreviewClass(element) {
    const clone = element.cloneNode(true);
    updateClassNamesForPreview(clone);
    return clone;
}

function updateClassNamesForPreview(element) {
    if (element.className) {
        element.className = element.className.split(' ')
            .map(className => className + '-preview').join(' ');
    }
    Array.from(element.children).forEach(updateClassNamesForPreview);
}




function printStudyGuide() {
    let printContainer = document.getElementById('print-container');
    if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        document.body.appendChild(printContainer);
    }
    printContainer.innerHTML = '';

    const studyContentContainer = document.getElementById('study-content-container');
    const pageContents = studyContentContainer.getElementsByClassName('page-content');

    Array.from(pageContents).forEach(page => {
        const clone = page.cloneNode(true);
        printContainer.appendChild(clone);
    });

    printContainer.style.position = 'absolute';
    printContainer.style.left = '0';
    printContainer.style.top = '0';
    printContainer.style.width = '100%';
    printContainer.style.height = '100%';
    printContainer.style.visibility = 'visible';

    window.print();

    printContainer.remove();
}

