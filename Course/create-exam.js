

document.addEventListener("DOMContentLoaded", function() {
    const printExam = document.getElementById('print-exam')
    const downloadExam = document.getElementById('download-exam')
    printExam.addEventListener('click', () => {
        printExamContent();
    })
    downloadExam.addEventListener('click', () => {
        printExamContent();
    })
});


function displayExamData(exam) {
    //Initial displays
    const examPDFTitle = document.getElementById('exam-pdf-title');
    const sanitizedCourseCode = currentCourse.courseCode.replace(/\s+/g, '');
    examPDFTitle.innerHTML = `${sanitizedCourseCode}-practice-exam.pdf`;

    const examPreviewContainer = document.getElementById('exam-preview-container');
    const examContentContainer = document.getElementById('exam-content-container');
    examContentContainer.innerHTML = '';
    examPreviewContainer.innerHTML = '';

    let pageContent = createNewPage(examContentContainer);
    let currentPageHeight = 0;
    let pageNumber = 1;  // Start page numbering
    const maxPageHeight = 700; // Maximum height of content per page

    exam.problems.forEach(problem => {
        const problemElement = document.createElement('div');
        problemElement.className = 'exam-problem';

        // Convert LaTeX lists in problem content to HTML lists
        const convertedContent = convertLaTeXListsToHTML(problem.content);

        const problemHeader = createDOMElement('text', 'problem-header', `Problem ${problem.problemNumber || ''} (${problem.totalPoints || 'N/A'} Points)`, problemElement);
        const problemContent = createDOMElement('p', 'problem-content', convertedContent, problemElement);
        if (problem.problemType != "multiple_choice") {
            createDOMElement('div', 'free-response-section', "", problemElement);
        }
        // Temporarily add element to page to calculate height
        pageContent.appendChild(problemElement);
        const elementHeight = calculateTotalHeight(problemElement);

        if (currentPageHeight + elementHeight > maxPageHeight) {
            // Remove the problem from current page and add to a new page
            addPreviewToContainer(pageContent, examPreviewContainer, pageNumber); // Add preview when the page is full

            pageContent.removeChild(problemElement);
            pageContent = createNewPage(examContentContainer);
            pageContent.appendChild(problemElement);
            currentPageHeight = elementHeight; 
            pageNumber++;  // Increment page number for the new page

        } else {
            currentPageHeight += elementHeight;
        }

    });

    addPreviewToContainer(pageContent, examPreviewContainer, pageNumber); // Add the last page preview

    document.getElementById('page-counter').innerHTML = `${pageNumber} pages`
    MathJax.typesetPromise().then(() => {
        console.log('MathJax has finished rendering the LaTeX content.');
    }).catch(err => console.error('MathJax rendering error:', err));
}


function addPreviewToContainer(pageContent, previewContainer, pageNumber) {
    const pagePreviewDiv = createDOMElement('div', 'page-preview-div', '', previewContainer)
    const preview = pageContent.cloneNode(true); // Clone the full page
    preview.className = 'page-preview'; // Use page-specific styling for previews

    // Optionally adjust the styling of elements in the preview
    preview.querySelectorAll('.problem-header').forEach(header => {
        header.classList.add('problem-preview-header');
    });
    preview.querySelectorAll('.problem-content').forEach(content => {
        content.classList.add('problem-body-preview');
    });
    preview.querySelectorAll('.free-response-section').forEach(section => {
        section.classList.add('free-response-section-preview');
    });

    pagePreviewDiv.appendChild(preview);
    createDOMElement('div', 'page-preview-number', `${pageNumber}`, pagePreviewDiv)
}

function createNewPage(container) {
    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    container.appendChild(pageContent);

    return pageContent;
}


function calculateTotalHeight(el) {
    const style = window.getComputedStyle(el);
    const totalHeight = el.offsetHeight + parseInt(style.marginTop) + parseInt(style.marginBottom);
    return totalHeight;
}

function convertLaTeXListsToHTML(latexContent) {
    // Convert enumerated lists
    latexContent = latexContent.replace(/\\begin{enumerate}([\s\S]*?)\\end{enumerate}/g, function(match, p1) {
        let htmlList = '<ol>';
        let items = p1.match(/\\item\s+(.*)/g); // Match all \item instances
        if (items) {
            items.forEach(function(item) {
                htmlList += '<li>' + item.slice(6) + '</li>'; // Slice to remove '\item ' prefix
            });
        }
        htmlList += '</ol>';
        return htmlList;
    });

    // Convert itemized lists
    latexContent = latexContent.replace(/\\begin{itemize}([\s\S]*?)\\end{itemize}/g, function(match, p1) {
        let htmlList = '<ul>';
        let items = p1.match(/\\item\s+(.*)/g); // Match all \item instances
        if (items) {
            items.forEach(function(item) {
                htmlList += '<li>' + item.slice(6) + '</li>'; // Slice to remove '\item ' prefix
            });
        }
        htmlList += '</ul>';
        return htmlList;
    });

    return latexContent;
}

function printExamContent() {
    let printContainer = document.getElementById('print-container');
    if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        document.body.appendChild(printContainer);
    }
    printContainer.innerHTML = '';  // Clear previous print contents

    // Get all 'page-content' divs from the examContentContainer
    const examContentContainer = document.getElementById('exam-content-container');
    const pageContents = examContentContainer.getElementsByClassName('page-content');

    // Clone each page content and append to the print container
    Array.from(pageContents).forEach(page => {
        const clone = page.cloneNode(true);
        printContainer.appendChild(clone);
    });

    // Apply CSS to ensure only the print container is visible
    printContainer.style.position = 'absolute';
    printContainer.style.left = '0';
    printContainer.style.top = '0';
    printContainer.style.width = '100%';
    printContainer.style.visibility = 'visible';

    window.print();  // Open the print dialog

    printContainer.remove();  // Clean up after printing
}

function downloadPDF(pdfTitle) {
    // Ensure MathJax has finished rendering all math expressions
    MathJax.typesetPromise().then(() => {
        setTimeout(generatePDF(pdfTitle), 1000); // Delay the PDF generation slightly after MathJax completes

    }).catch(err => {
        console.error('MathJax rendering error:', err);
    });
}

function generatePDF(pdfTitle) {
    const doc = new jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    });

    const pages = document.querySelectorAll('.page-content');
    const pageTotal = pages.length;
    let pagesRendered = 0;

    pages.forEach((page, index) => {
        html2canvas(page, { scale: 2, logging: true, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            if (index > 0) {
                doc.addPage();
            }
            doc.addImage(imgData, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());
            pagesRendered++;
            if (pagesRendered === pageTotal) {
                doc.save(pdfTitle);
            }
        }).catch(error => {
            console.error("Error capturing page with html2canvas: ", error);
        });
    });
}