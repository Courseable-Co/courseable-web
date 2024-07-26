//
//  lecture-notes.js
//  Courseable
//
//  Created by Adrian Martushev on 7/19/24.
//

//Globals
var currentUserID, currentCourseID;
var isPaused = false;
var isRecording = false;
var recorder, audioStream;
var recordingTimer, startTime;
var recognition;
var transcriptionContainer, summaryContainer, refreshSummary;
let lectureSegments = [];
let segmentSummaries = [];
var formattedSummary;


//DOM Elements
var recordingButton, pauseButton, stopButton, micIcon, pauseIcon, stopIcon
var elapsedTime, recordingTimerText
var LNSaveModal, LNCloseModal, LNSaveButton, LNDiscardButton, LNModalTextContent

var iconColors = {
    'mic' : '#5956d6',
    'pause' : '#ff9500',
    'stop' : '#000000',
    'inactive' : '#333'
}

document.addEventListener("DOMContentLoaded", function() {
    // Initialize elements
    recordingButton = document.getElementById('recording-button');
    pauseButton = document.getElementById('pause-button');
    stopButton = document.getElementById('stop-button');
    micIcon = document.getElementById('mic-icon');
    pauseIcon = document.getElementById('pause-icon');
    stopIcon = document.getElementById('stop-icon');
    recordingTimerText = document.getElementById('recording-timer-text');
    LNSaveModal = document.getElementById('LN-save-modal')

    //Authenticate User
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUserID = user.uid;
            console.log("User is signed in with UID:", user.uid);
            const urlParams = new URLSearchParams(window.location.search);
            const courseID = urlParams.get('courseID');

            if (courseID) {
                currentCourseID = decodeURIComponent(courseID);
                console.log("Decoded courseID:", courseID);
            } else {
                console.log("There is no course assigned for these notes")
            }
        } else {
            // User is not signed in, redirect to login page
            window.location.href = '/login';
        }
    });

    // Set initial states
    recordingTimerText.style.visibility = 'hidden';
    LNSaveModal.style.visibility = 'none';
    setButtonState('none')

    // Attach event listeners
    recordingButton.addEventListener('click', function() { toggleRecording('recording'); });
    pauseButton.addEventListener('click', function() { toggleRecording('paused'); });
    stopButton.addEventListener('click', function() { toggleRecording('stopped'); });

    //Set up transcription
    setupTranscription();

    //Set up save modal
    setupSaveModal();
})


function toggleRecording(state) {
    if (state === 'recording' && !recorder) {
        setupRecorder().then(() => {
            recorder.start();
            isRecording = true;
            recognition.start();  // Start transcribing when recording starts
        });
    } else if (recorder) {
        if (state === 'recording' && recorder.state === 'paused') {
            recorder.resume();
            recognition.start();  // Resume transcription
        } else if (state === 'paused') {
            recorder.pause();
            recognition.stop();  // Stop transcribing when paused
            isPaused = true;
        } else if (state === 'stopped') {
            recorder.stop();
            recognition.stop();  // Stop transcribing when recording stops
            isRecording = false;
            isPaused = false;
            showSaveModal();
        }
    }
    setButtonState(state);
}

function setButtonState(active) {
    // Reset all buttons and icons to default
    recordingButton.className = pauseButton.className = stopButton.className = 'recording-button';
    micIcon.style.color = iconColors['inactive'];
    pauseIcon.style.color = iconColors['inactive'];
    stopIcon.style.color = iconColors['inactive'];

    // Set active button and icon
    switch(active) {
        case 'recording':
            recordingButton.className = 'recording-button-selected';
            micIcon.style.color = iconColors['inactive'];
            pauseIcon.style.color = iconColors['pause'];
            stopIcon.style.color = iconColors['stop'];
            break;
        case 'paused':
            pauseButton.className = 'recording-button-selected';
            micIcon.style.color = iconColors['mic'];
            pauseIcon.style.color = iconColors['inactive'];
            stopIcon.style.color = iconColors['stop'];
            break;
        case 'stopped':
            stopButton.className = 'recording-button-selected';
            setButtonState('none')
            break;
    }
}

async function setupRecorder() {
    if (!recorder) { // Ensure recorder is only set up once
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recorder = new MediaRecorder(audioStream);

            recorder.onstart = () => {
                startTime = Date.now();
                recordingTimerText.style.visibility = 'visible'; // Show timer when recording starts
                recordingTimer = setInterval(updateRecordingTimer, 1000); // Update every second
            };

            recorder.onpause = () => {
                clearInterval(recordingTimer);
            };

            recorder.onresume = () => {
                startTime = Date.now() - elapsedTime * 1000;
                recordingTimer = setInterval(updateRecordingTimer, 1000);
            };

            recorder.onstop = handleStop;

            recorder.ondataavailable = (e) => {
                // Handle data chunks here
            };
        } catch (err) {
            console.error('Failed to initialize media recording:', err);
        }
    }
}

function handleStop() {
    clearInterval(recordingTimer);
    elapsedTime = 0;
    recordingTimerText.innerText = formatTime(elapsedTime); // Update timer to zero
    recordingTimerText.style.visibility = 'hidden'; // Hide timer when stopped
    audioStream.getTracks().forEach(track => track.stop()); // Stop each track on the stream
}

function updateRecordingTimer() {
    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    recordingTimerText.innerText = formatTime(elapsedTime);
}

function formatTime(seconds) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;
    return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${secs < 10 ? '0' + secs : secs}`;
}



//=================Transcription===============================

function setupTranscription() {
    transcriptionContainer = document.getElementById('transcription-text-container');
    summaryContainer = document.getElementById('summary-text-container')
    transcriptionContainer.textContent = ''; 
    summaryContainer.textContent = '';

    //Attach event listeners
    refreshSummary = document.getElementById('refresh-summary');
    refreshSummary.addEventListener('click', manualSummarize);

    let finalTranscript = '';
    let debounceTimer;
    let lastUpdateTime = Date.now();

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = function(event) {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';

                    lectureSegments.push(event.results[i][0].transcript);

                    if (lectureSegments.join(' ').split(' ').length >= 100) {
                        processSegment(lectureSegments.join(' '));
                        lectureSegments = []; // Clear the segment array after processing
                    }
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Instant update for interim results to ensure real-time feedback
            transcriptionContainer.textContent = finalTranscript + interimTranscript;

            // Debounce updating for final transcript to reduce flicker
            let now = Date.now();
            if (now - lastUpdateTime > 1000) { // Update final transcript if more than 1 second has passed since last update
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    transcriptionContainer.textContent = finalTranscript;
                    lastUpdateTime = Date.now();
                }, 300); // Delay slighty to catch quick successive final results
            }

        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
        };

        recognition.onend = function() {
            if (isRecording && !isPaused) {
                recognition.start(); // Automatically restart if still recording
            } else {
                // Process any remaining segment when recording stops
                if (lectureSegments.length > 0) {
                    processSegment(lectureSegments.join(' '));
                }
                // Display the final transcript when recognition stops
                transcriptionContainer.textContent = finalTranscript;
            }
        };
    } else {
        console.log('Speech recognition not supported in this browser.');
    }
}


// Function to process and summarize each segment
async function processSegment(transcriptSegment) {
    const summary = await summarizeText(transcriptSegment);
    segmentSummaries.push(summary);

    // Convert Markdown bold to HTML <strong> tags
    tempSummary = summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    summaryContainer.innerHTML += "\n\n" + tempSummary + "\n";
    formattedSummary += tempSummary

    MathJax.typesetPromise().then(() => {
        console.log('MathJax has finished rendering the LaTeX content.');
    }).catch(err => console.error('MathJax rendering error:', err));
}


// summarizer.js
async function summarizeText(text) {
    const summaryResult = document.getElementById('summaryResult');

    try {
        const response = await fetch('https://courseable-d6c39cc199c5.herokuapp.com/summarizeText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                text: text
            })
        });

        if (response.ok) {
            const result = await response.json();
            return result.summary;
        } else {
            const errorResult = await response.json();
            console.error(`Error summarizing text: ${errorResult.error}`);
            return "Error summarizing text";
        }
    } catch (error) {
        console.error(`Error in communication with summarization service: ${error.message}`);
        return "Error in communication with summarization service";
    }
}

// Manual summarize function
async function manualSummarize() {
    const currentText = transcriptionContainer.textContent;
    if (currentText.trim().length === 0) {
        summaryContainer.innerHTML = "No content to summarize.";
        return;
    }

    const summary = await summarizeText(currentText);
    tempSummary = summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    summaryContainer.innerHTML = tempSummary;
    formattedSummary += tempSummary

    MathJax.typesetPromise().then(() => {
        console.log('MathJax has finished rendering the LaTeX content.');
    }).catch(err => console.error('MathJax rendering error:', err));
}


//===================Save Modal and Saving to Firestore============================

function showSaveModal() {
    $('#LN-save-modal').css('display', 'flex').hide().fadeIn();
    $('#LN-save-modal').fadeIn();

    LNModalTextContent.innerHTML = formattedSummary

    MathJax.typesetPromise().then(() => {
        console.log('MathJax has finished rendering the LaTeX content.');
    }).catch(err => console.error('MathJax rendering error:', err));
}

function hideSaveModal() {
    $('#LN-save-modal').fadeOut();
}

function setupSaveModal() {
    LNSaveButton = document.getElementById('LN-save-button');
    LNDiscardButton = document.getElementById('LN-discard-button');  // Ensure correct ID if there's a separate discard button
    LNModalTextContent = document.getElementById('LN-modal-text-content');
    LNCloseModal = document.getElementById('LN-close-modal');

    LNCloseModal.addEventListener('click', hideSaveModal);
    LNSaveButton.addEventListener('click', saveLectureNotes);
    LNDiscardButton.addEventListener('click', resetLectureNotes);  // Assuming you want a separate handler for discarding
}

async function saveLectureNotes() {
    const db = firebase.firestore();
    const date = new Date(); // Use the current date-time as the creation timestamp

    if (!window.currentUserID || !currentCourseID) {
        alert("User or course information is missing.");
        return;
    }

    // Reference to the specific course's lectures collection
    const lecturesCollection = db.collection('users')
                                .doc(window.currentUserID)
                                .collection('courses')
                                .doc(currentCourseID)
                                .collection('lectures');
    
    try {
        // Generate a new document within the lectures collection
        const lectureDocRef = lecturesCollection.doc(); // Creates a new document with a unique ID

        await lectureDocRef.set({
            transcription: transcriptionContainer.textContent,
            transcriptionSummary: formattedSummary,
            duration: elapsedTime,
            date: firebase.firestore.Timestamp.fromDate(date)
        }, { merge: true }); // Use merge to avoid overwriting entire document if it exists

        console.log('Lecture notes saved successfully with ID:', lectureDocRef.id);
        alert('Lecture notes saved successfully!');
    } catch (error) {
        console.error('Error saving lecture notes:', error);
        alert('Failed to save lecture notes.');
    }
}

function resetLectureNotes() {
    window.location.href = "/lecture-notes"
}