
var startQuizContainer, initialQuizText
var loadingQuizDiv, loadingQuizText
var topicsList, quizTopicsContainer, createQuizButton
var quizProblemContainer, quizProblemsList

let selectedTopicsArray = [];

document.addEventListener("DOMContentLoaded", function() {
    //Get elements
    startQuizContainer = document.getElementById('start-quiz-container')
    initialQuizText = document.getElementById('initial-quiz-text')
    loadingQuizDiv = document.getElementById('loading-quiz-div')
    loadingQuizText = document.getElementById('loading-quiz-text')
    quizTopicsContainer = document.getElementById('quiz-topics-container')
    topicsList = document.getElementById('topics-list')
    createQuizButton = document.getElementById('create-quiz-button')
    quizProblemContainer = document.getElementById('quiz-problem-container')
    quizProblemsList = document.getElementById('quiz-problems-list')

    //Set initial displays
    startQuizContainer.style.display = 'flex'
    initialQuizText.style.display = 'flex'
    loadingQuizDiv.style.display = 'none'
    quizTopicsContainer.style.display = 'none'
    createQuizButton.style.display = 'none'
    quizProblemsList.innerHTML = ''
    quizProblemContainer.style.display = 'none'
    quizProblemsList.innerHTML = ''


    //Add event listeners
    const fetchTopicsButton = document.getElementById('fetch-topics-button')
    fetchTopicsButton.addEventListener('click', () => {
        extractTopicsForQuiz(currentCourse.id, currentUserID, currentCourse.syllabusText)
    });

    createQuizButton.addEventListener('click', () => {
        createQuiz(currentCourse.id, currentUserID, selectedTopicsArray)
    });

})



function extractTopicsForQuiz(courseID, userID, syllabusText) {
    $(initialQuizText).fadeOut(400, () => {
        $(loadingQuizDiv).fadeIn();
    });

    const url = 'https://courseable-d6c39cc199c5.herokuapp.com/extractTopicsForQuiz';
    const formData = new FormData();
    formData.append('courseID', courseID);
    formData.append('userID', userID);
    formData.append('syllabusText', syllabusText);

    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Extracted Topics:', data.topics);
        loadingQuizDiv.style.display = 'none';

        $(topicsList).empty().fadeIn();
        $(quizTopicsContainer).fadeIn();

        data.topics.forEach(topic => {
            let quizTopicDiv = createDOMElement('div', 'quiz-topic', '', topicsList, function() {
                let isSelected = selectedTopicsArray.indexOf(topic) !== -1;
                if (isSelected) {
                    // Remove topic from selected array
                    selectedTopicsArray = selectedTopicsArray.filter(t => t !== topic);
                    this.classList.remove('quiz-topic-selected');
                    this.classList.add('quiz-topic');
                } else {
                    // Add topic to selected array
                    selectedTopicsArray.push(topic);
                    this.classList.remove('quiz-topic');
                    this.classList.add('quiz-topic-selected');

                    createQuizButton.style.display = 'flex'
                }
                this.firstChild.textContent = isSelected ? '' : ''; // Toggle icons
            });
            createDOMElement('div', 'quiz-circle-icon', '', quizTopicDiv);
            createDOMElement('div', 'quiz-topic-text', topic, quizTopicDiv);
        });

    })
    .catch(error => {
        console.error('Error extracting topics:', error);
    });
}

function createQuiz(courseID, userID, topics) {
    createQuizButton.style.display = 'none';
    loadingQuizText.innerHTML = "Creating your quiz...";
    $(quizTopicsContainer).fadeOut(400, () => {
        $(loadingQuizDiv).fadeIn();
    });

    const url = 'https://courseable-d6c39cc199c5.herokuapp.com/createQuiz';
    const formData = new FormData();
    formData.append('courseID', courseID);
    formData.append('userID', userID);
    formData.append('topics', JSON.stringify(topics));

    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.quizId) {
            listenToQuiz(data.quizId, userID, courseID);
        } else {
            console.error('Error creating quiz:', data.error);
            alert('Error creating quiz. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error creating quiz:', error);
        alert('Error creating quiz. Please try again.');
    });
}

function listenToQuiz(quizId, userID, courseID) {
    const quizRef = database.collection('users').doc(userID).collection('courses').doc(courseID).collection('quizzes').doc(quizId);

    quizRef.onSnapshot(doc => {
        if (doc.exists) {
            loadQuizProblems(doc.data());
        } else {
            console.error("No quiz data found!");
        }
    }, error => {
        console.error("Error fetching quiz data:", error);
    });
}


//================================Quiz===================================
var quizProblemContent, quizAnswersContainer
var problemCorrectText, problemIncorrectText
var problemNavigationContainer, nextProblemButton, lastProblemButton
var submitProblemButton

var selectedResponses = {}; 
var currentQuestionIndex = 0;
var quizData = null; // Global variable to store quiz data

function loadQuizProblems(data) {
    quizData = data;

    //Get elements
    quizProblemContainer = document.getElementById('quiz-problem-container')
    quizProblemsList = document.getElementById('quiz-problems-list')
    quizProblemContent = document.getElementById('quiz-problem-content')
    quizAnswersContainer = document.getElementById('quiz-answers-container')

    problemNavigationContainer = document.getElementById('problem-navigation-container')
    nextProblemButton = document.getElementById('next-problem-button')
    lastProblemButton = document.getElementById('last-problem-button')
    problemCorrectText = document.getElementById('problem-correct-text')
    problemIncorrectText = document.getElementById('problem-incorrect-text')
    submitProblemButton = document.getElementById('submit-problem-button')

    //Set initial states
    quizAnswersContainer.innerHTML = ''
    $(startQuizContainer).fadeOut(400, () => {
        $(quizProblemContainer).css('display', 'flex').hide().fadeIn();
        console.log('Quiz Created Successfully:', data);
    })

    //Add event listeners
    nextProblemButton.addEventListener('click', () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            currentQuestionIndex++;
            loadProblem(quizData.questions[currentQuestionIndex], currentQuestionIndex);
        }
    });

    lastProblemButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadProblem(quizData.questions[currentQuestionIndex], currentQuestionIndex);
        }
    });

    //Build problems container
    data.questions.forEach((question, index) => {
        const quizProblemDiv = createDOMElement('div', 'quiz-problem-div', '', quizProblemsList)
        quizProblemDiv.setAttribute('id', `problem-${index}`)
        createDOMElement('div', 'quiz-problem-text', `Problem ${index + 1}`, quizProblemDiv);
        var problemIcon = createDOMElement('div', 'quiz-problem-unfinished', '', quizProblemDiv)
        problemIcon.setAttribute('id', `problem-icon-${index}`)
        quizProblemDiv.addEventListener('click', () => {
            loadProblem(question, index)
        })
    })

    //Build first problem
    loadProblem(data.questions[0], 0);
}


function loadProblem(question, index) {
    submitProblemButton.style.display = 'none'
    problemNavigationContainer.style.display = 'none'

    if (index !== undefined) {
        currentQuestionIndex = index; // Update the global index if specified
    } else {
        question = quizData.questions[currentQuestionIndex]; // Use the current index if not specified
    }

    quizProblemContent.innerHTML = question.question;
    quizAnswersContainer.innerHTML = '';

    const responseSubmitted = selectedResponses[currentQuestionIndex] !== undefined;
    const correctIndex = question.correctIndex;


    question.options.forEach((option, optionIndex) => {
        let quizAnswerOption = createDOMElement('div', 'quiz-answer-option', '', quizAnswersContainer);
        quizAnswerOption.setAttribute('id', `quiz-answer-${optionIndex}`)
        let icon = createDOMElement('div', 'quiz-circle-icon', '', quizAnswerOption);
        createDOMElement('div', 'quiz-problem-solution-text', option, quizAnswerOption);

        if (responseSubmitted) {
            if (optionIndex === selectedResponses[currentQuestionIndex]) {
                // Mark the selected response
                quizAnswerOption.className = optionIndex === correctIndex ? 'quiz-answer-option-correct' : 'quiz-answer-option-selected';
                icon.textContent = optionIndex === correctIndex ? '' : '';
            }

            if (!responseSubmitted || optionIndex === correctIndex) {
                // Highlight the correct answer if no response or if this is the correct answer
                quizAnswerOption.className = 'quiz-answer-option-correct';
                icon.textContent = '';
            }

            // Disable interaction since the response has been submitted
            quizAnswerOption.style.pointerEvents = 'none';
        } else {
            if (selectedResponses[currentQuestionIndex] === optionIndex) {
                // Style as selected if this was the previously selected response
                quizAnswerOption.className = 'quiz-answer-option-selected';
                icon.textContent = '';
    
            }
    
            // Allow interaction only if this question hasn't been submitted yet
            if (selectedResponses[currentQuestionIndex] === undefined) {
                quizAnswerOption.addEventListener('click', () => {
                    quizAnswersContainer.querySelectorAll('.quiz-answer-option').forEach((el, idx) => {
                        // Reset other options
                        el.className = 'quiz-answer-option';
                        el.firstChild.textContent = '';
                    });
                    // Mark the current selection
                    quizAnswerOption.className = 'quiz-answer-option-selected';
                    icon.textContent = '';
                    submitProblemButton.style.display = 'flex'; // Show submit button
                    submitProblemButton.onclick = () => handleSubmit(optionIndex, question.correctIndex, index);
                });
            }
        }

    });

    displayNavigationAndFeedback(index)

    document.querySelectorAll('.quiz-problem-div').forEach(el => el.classList.remove('quiz-problem-div-current'));
    document.getElementById(`problem-${index}`).classList.add('quiz-problem-div-current');

    MathJax.typesetPromise()
}

function handleSubmit(selectedIndex, correctIndex, index) {
    selectedResponses[index] = selectedIndex; // Store the response
    const isCorrect = selectedIndex === correctIndex;
    problemCorrectText.style.display = isCorrect ? 'flex' : 'none';
    problemIncorrectText.style.display = isCorrect ? 'none' : 'flex';
    updateProblemIcon(index, isCorrect); // Update problem icon based on correctness

    $(submitProblemButton).fadeOut(); // Hide submit button after submission
    $(problemNavigationContainer).fadeIn(); // Show navigation buttons

    // Update the selected answer's style
    const selectedOption = document.getElementById(`quiz-answer-${selectedIndex}`);
    const icon = selectedOption.querySelector('.quiz-circle-icon');
    selectedOption.className = isCorrect ? 'quiz-answer-option-correct' : 'quiz-answer-option-selected';
    icon.textContent = isCorrect ? '' : ''; // '' for correct, '' for incorrect

    // Optionally highlight the correct answer if the selected answer was wrong
    if (!isCorrect) {
        const correctOption = document.getElementById(`quiz-answer-${correctIndex}`);
        const correctIcon = correctOption.querySelector('.quiz-circle-icon');
        correctOption.className = 'quiz-answer-option-correct';
        correctIcon.textContent = '';
    }

    // Prevent further changes by removing event listeners
    document.querySelectorAll('.quiz-answer-option').forEach(option => {
        option.replaceWith(option.cloneNode(true));
    });
}

function updateProblemIcon(index, isCorrect) {
    let problemIcon = document.getElementById(`problem-icon-${index}`);
    problemIcon.textContent = isCorrect ? '' : ''; // Change icons based on the status
    problemIcon.className = isCorrect ? 'quiz-problem-correct' : 'quiz-problem-incorrect';
}

function displayNavigationAndFeedback(index) {
    if (selectedResponses[index] !== undefined) {
        problemNavigationContainer.style.display = 'flex';
        const isCorrect = selectedResponses[index] === quizData.questions[index].correctIndex;
        problemCorrectText.style.display = isCorrect ? 'flex' : 'none';
        problemIncorrectText.style.display = isCorrect ? 'none' : 'flex';
    }

    nextProblemButton.style.display = index < quizData.questions.length - 1 ? 'flex' : 'none';
    lastProblemButton.style.display = index > 0 ? 'flex' : 'none';
}
