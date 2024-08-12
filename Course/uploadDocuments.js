



function showUploadDocuments() {

    // Set the display to flex directly via CSS before starting the fade in
    $('#upload-documents-modal').css('display', 'flex').hide().fadeIn();

    // Adjust other elements' display properties
    $('#upload-documents-initial-view').css('display', 'block');
    $('#document-analyzing-div').css('display', 'none');
    $('#document-success-div').css('display', 'none');
}

function hideUploadDocuments() {
    $('#upload-documents-modal').fadeOut()
}

function showAnalyzingDocument() {
    $('#upload-documents-initial-view').css('display', 'none');
    $('#document-analyzing-div').css('display', 'flex').hide().fadeIn();
    $('#document-success-div').css('display', 'none');
}

function showAnalysisResults(data) {
    $('#upload-documents-initial-view').css('display', 'none');
    $('#document-analyzing-div').css('display', 'none');
    $('#document-success-div').css('display', 'flex').hide().fadeIn();
    buildDocumentSummary(data)
}

document.addEventListener("DOMContentLoaded", function() {
    //Assign elements
    const confirmDocumentUploadButton = document.getElementById('confirm-document-upload-button')
    const documentUploadButton = document.getElementById('document-upload-button')
    const closeUploadButton = document.getElementById('close-upload-button')
    const closeUploadModalButton = document.getElementById('close-upload-modal-button')
    const fileInput = document.getElementById('document-file-input');

    //Set initial states
    $('#upload-documents-initial-view').css('display', 'block');
    $('#document-analyzing-div').css('display', 'none');
    $('#document-success-div').css('display', 'none');


    //On clicks
    closeUploadModalButton.addEventListener('click', hideUploadDocuments)
    closeUploadButton.addEventListener('click', hideUploadDocuments)

    // Handle button clicks to trigger file selection
    documentUploadButton.addEventListener('click', function() {
        console.log('clicked')
        fileInput.click();
    });

    // Handle file selection from the file input
    fileInput.addEventListener('change', function(event) {
        const files = event.target.files;
        handleFileUpload(files[0], currentCourse.id); // Assume single file upload, adjust if multiple files are supported
    });

    // Drag and drop events
    documentUploadButton.addEventListener('dragover', (event) => {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy'; // Visual feedback
        documentUploadButton.style.backgroundColor = '#242427';
    });

    documentUploadButton.addEventListener('dragleave', (event) => {
        uploadButton.style.backgroundColor = '#1d1d1f'; 
    });

    documentUploadButton.addEventListener('drop', (event) => {
        event.stopPropagation();
        event.preventDefault();
        documentUploadButton.style.backgroundColor = '#1d1d1f';
        const files = event.dataTransfer.files;
        handleFileUpload(files[0], currentCourse.id);
    });
})


function handleFileUpload(file, courseId) {
    showAnalyzingDocument()

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', currentUserID);
    formData.append('courseId', courseId);

    fetch('https://courseable-d6c39cc199c5.herokuapp.com/uploadCourseDocument', { 
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server response:', data.response);
        showAnalysisResults(data.response); 
    })
    .catch(error => {
        console.error('Upload and analysis failed:', error);
        showError('Failed to process the document, please try again.');
    });
}




function buildDocumentSummary(documentData) {
    const documentSummaryDiv = document.getElementById('document-summary-div');
    documentSummaryDiv.innerHTML = '';

    createDOMElement('div', 'document-summary-header', "Document Summary", documentSummaryDiv);
    createDOMElement('div', 'document-summary-text', documentData.documentSummary, documentSummaryDiv);

    createDOMElement('div', 'document-summary-header', "Key Points", documentSummaryDiv);

    // Ensure keyPointsList is a UL element
    let keyPointsList = createDOMElement('ul', 'document-list-items', '', documentSummaryDiv);

    // Check if keyPoints is defined and is an array before iterating
    if (Array.isArray(documentData.keyPoints)) {
        documentData.keyPoints.forEach(keyPoint => {
            createDOMElement('li', 'document-list-item', keyPoint, keyPointsList);
        });
    } else {
        console.error('Key points data is invalid or undefined:', documentData.keyPoints);
        // Optionally, handle the scenario where key points are missing
        createDOMElement('li', 'document-list-item', 'No key points available.', keyPointsList);
    }
}