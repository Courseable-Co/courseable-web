//Globals
var currentThreadID;
let currentMessageListener = null;
const logoURL = 'https://firebasestorage.googleapis.com/v0/b/courseable-928cf.appspot.com/o/Logos%2Fcourseable_c_logotype.png?alt=media&token=ef070fe9-b655-4b32-9555-a484618af196'



document.addEventListener('DOMContentLoaded', function() {    
    const messageField = document.getElementById('message-field');
    const sendButton = document.getElementById('send-message');
    const newConversationButton = document.getElementById('new-conversation-button');

    //Wait for authentication to return user
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            createEmptyStateContainer()
            fetchHistory(user.uid)
            currentThreadID = localStorage.getItem('currentThreadID')
            console.log("Loading course chat, current thread : ", currentThreadID );
            if (currentThreadID) {
                listenToMessageThread(currentThreadID)
            }
        }
    });

    sendButton.addEventListener('click', function() {
        sendUserMessage();
    });

    messageField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendUserMessage();
        }
    });

    newConversationButton.addEventListener('click', function() {
        currentMessageListener = null
        currentThreadID = null
        createEmptyStateContainer()
    });
});




function sendUserMessage() {
    const messageField = document.getElementById('message-field');
    const input = messageField.value; 
    if (!input.trim()) return;

    if (!currentThreadID) {
        startConversation(input).then(() => {
            sendMessageToServer(input);
        }).catch(error => {
            console.error('Failed to start conversation:', error);
        });
    } else {
        sendMessageToServer(input);
    }
}


function startConversation(previewMessage) {
    return fetch('https://courseable-d6c39cc199c5.herokuapp.com/startConversation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            preview_message: previewMessage,
            user_id: currentUserID,
            course_id: currentCourse.id 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.thread_id) {
            currentThreadID = data.thread_id
            // Store thread ID in local storage
            localStorage.setItem('currentThreadID', currentThreadID);
            console.log("Current Thread", currentThreadID);
            listenToMessageThread(currentThreadID);
            return currentThreadID; 
        } else {
            throw new Error('Failed to start new conversation: No thread ID received.');
        }
    })
    .catch(error => {
        console.error('Error starting conversation:', error);
    });
}

function sendMessageToServer(prompt) {
    const messageField = document.getElementById('message-field');
    messageField.value = '';

    const userMessageFirestore = {
        id: generateRandomId(), 
        role: "user",
        content: prompt,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    const courseRef = database.collection('users').doc(currentUserID).collection('courses').doc(currentCourse.id)
    const messagesRef = courseRef.collection('messageThreads').doc(currentThreadID).collection('messages');

    messagesRef.add(userMessageFirestore)
        .then(() => {
            console.log('User message added successfully');
            // After adding user's message, fetch response from server
            fetch('https://courseable-d6c39cc199c5.herokuapp.com/getResponse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    thread_id: currentThreadID,
                    user_id: currentUserID,
                    course_code: currentCourse.courseCode,
                    course_id : currentCourse.id
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.geminiResponse) {
                    console.log(`Updated response in thread: ${currentThreadID} for data:\n${data.geminiResponse}`);
                    // Optionally update Firestore with Gemini's response here
                }
            })
            .catch(error => {
                console.error('Error fetching response from Gemini:', error);
            });
        })
        .catch(error => {
            console.error('Error adding user message to Firestore:', error);
        });
}

function generateRandomId() {
    // Implementation for generating a random ID (e.g., using base64 encoding of a random value or UUIDs)
    return btoa(String(Math.random()).substring(2));
}

function createEmptyStateContainer() {
    const emptyStateContainer = document.getElementById('empty-state-container');
    emptyStateContainer.style.display = 'flex'

    const messagesContentContainer = document.getElementById('messages-content-container');

    messagesContentContainer.style.display = 'none';
    messagesContentContainer.innerHTML = '';
    currentThreadID = null;

    const presetPromptsContainer = document.getElementById('preset-prompts-container');
    presetPromptsContainer.innerHTML = '';
    fetchPresetQuestions()    
}

function fetchPresetQuestions() {
    const courseRef = database.collection('users').doc(currentUserID).collection('courses').doc(currentCourse.id);

    courseRef.get().then(doc => {
        if (doc.exists && doc.data().presetQuestions) {
            const presets = doc.data().presetQuestions;
            displayPresets(presets);
        } else {
            console.error('No preset questions found or document does not exist');
            // Handle the case where no presets are available
        }
    }).catch(error => {
        console.error('Error fetching preset questions:', error);
    });
}

function displayPresets(presets) {
    const presetPromptsContainer = document.getElementById('preset-prompts-container');
    presets.forEach(preset => {
        createDOMElement('div', 'preset-prompt-text', preset, presetPromptsContainer, function() {
            console.log('Preset clicked:', preset);
            if (!currentThreadID) {
                startConversation(preset).then(() => {
                    sendMessageToServer(preset);
                }).catch(error => {
                    console.error('Failed to start conversation:', error);
                });
            } else {
                sendMessageToServer(preset);
            }
        });
    });
}



function listenToMessageThread(thread_id) {
    // Update localStorage with the new thread ID
    localStorage.setItem('currentThreadID', thread_id);
    console.log("Current Thread: ", thread_id);

    // Detach the previous listener if it exists
    if (currentMessageListener) {
        currentMessageListener();
        console.log("Detached previous message listener.");
    }

    // Reference to the new message thread
    const messagesRef = firebase.firestore()
        .collection('users').doc(currentUserID)
        .collection('courses').doc(currentCourse.id)
        .collection('messageThreads').doc(thread_id)
        .collection('messages');

    const messagesContainer = document.getElementById('messages-content-container');
    messagesContainer.innerHTML = '';  // Clear previous messages
    messagesContainer.style.display = 'flex';

    document.getElementById('empty-state-container').style.display = 'none';

    // Setting up a new real-time listener for the new thread
    currentMessageListener = messagesRef.orderBy('timestamp').onSnapshot(snapshot => {
        messagesContainer.innerHTML = '';  // Clear and update messages each time there's a change
        snapshot.forEach(doc => {
            const message = doc.data();
            displayMessage(message, messagesContainer);
        });

        // Ensure the latest message is visible
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, err => {
        console.error('Error fetching messages:', err);
    });
}

function displayMessage(message, container) {
    console.log(message)
    const messageDiv = createDOMElement('div', message.role === 'user' ? 'user-message-container' : 'assistant-message-container', '', container);
    
    if (message.role === 'assistant') {
        const imgDiv = createDOMElement('div', 'assistant-image-div', '', messageDiv);
        createDOMElement('img', 'assistant-image', logoURL, imgDiv);
    }

    // Apply text formatting before creating the message element
    const formattedContent = formatMessageContent(message.content);
    createTextElement('div', message.role === 'user' ? 'user-message-text' : 'assistant-message-text', formattedContent, messageDiv, true);

    // Scroll to the bottom of the container
    container.scrollTop = container.scrollHeight;

    MathJax.typesetPromise()
}

function formatMessageContent(text) {
    const lines = text.split('\n');
    let formattedText = '';
    let inList = false;  // Track if we are currently inside a list

    lines.forEach((line, index) => {
        let trimmedLine = line.trim();
        if (trimmedLine.startsWith('* ')) {  // Check if line starts with '* '
            if (!inList) {
                inList = true;
                formattedText += '<ul>';  // Start a new <ul> if we weren't already in a list
            }
            // Apply bold formatting directly for lines within lists
            let listItemContent = trimmedLine.substring(1).trim();
            listItemContent = listItemContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');  // Bold within lists
            formattedText += `<li>${listItemContent}</li>`;
        } else {
            if (inList) {
                formattedText += '</ul>';  // Close the list if it was open
                inList = false;
            }
            // Handle bold formatting for non-list content
            if (/\*\*(.*?)\*\*/.test(trimmedLine)) {
                // If bold content not in a list, add two line breaks before and one after
                formattedText += `<br><br><strong>${trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1')}</strong><br>`;
            } else {
                formattedText += `${line}\n`;  // Regular line without additional formatting
            }
        }
    });

    if (inList) { // Ensure the list is closed if the text ends while still inside a list
        formattedText += '</ul>';
    }

    return formattedText;
}

function createTextElement(type, className, content, parent, isHTML = false) {
    const element = document.createElement(type);
    element.className = className;
    if (isHTML) {
        element.innerHTML = content; // Use innerHTML when the content includes HTML tags
    } else {
        element.textContent = content; // Use textContent to prevent HTML injection
    }
    parent.appendChild(element);
    return element;
}