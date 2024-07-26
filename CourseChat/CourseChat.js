
document.addEventListener('DOMContentLoaded', function() {    
    const messageField = document.getElementById('message-field');
    const sendButton = document.getElementById('send-message');

    //Wait for authentication to return user
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            createEmptyStateContainer()
            fetchHistory(user.uid)
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
});




function sendUserMessage() {
    const messageField = document.getElementById('message-field');
    const input = messageField.value; 
    if (!input.trim()) return;

    if (isSubscribed || tokensRemaining > 0) {
        if (!currentThreadID) {
            startConversation(input).then(() => {
                sendMessageToServer(input);
            }).catch(error => {
                console.error('Failed to start conversation:', error);
            });
        } else {
            sendMessageToServer(input);
        }
    } else {
        window.location.href = '/subscribe'
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
            model: 'gpt-4o',
            user_id: currentUserID,
            course_id: currentCourse.id 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.thread_id) {
            // Store thread ID in local storage
            localStorage.setItem('currentThreadID', data.thread_id);
            console.log("Current Thread", data.thread_id);
            loadMessages(data.thread_id);  // Load messages for this thread
            return data.thread_id; 
        } else {
            throw new Error('Failed to start new conversation: No thread ID received.');
        }
    })
    .catch(error => {
        console.error('Error starting conversation:', error);
    });
}

function sendMessageToServer(input) {
    const messageField = document.getElementById('message-field');
    messageField.value = '';

    const currentThreadID = localStorage.getItem('currentThreadID');  // Retrieve the current thread ID from local storage

    fetch('https://courseable-d6c39cc199c5.herokuapp.com/send_query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: input,
            model: 'gpt-4o',
            thread_id: currentThreadID,
            user_id: currentUserID
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(`Updated response in thread: ${currentThreadID} for data:\n${data.response}`);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function createEmptyStateContainer() {
    const messagesContentContainer = document.getElementById('messages-content-container');
    const emptyStateContainer = document.getElementById('empty-state-container');

    messagesContentContainer.style.display = 'none';
    messagesContentContainer.innerHTML = '';  // Clear previous messages
    currentThreadID = null;

    const presetPromptsContainer = document.getElementById('preset-prompts-container');
    presetPromptsContainer.innerHTML = '';  // Clear previous presets

    fetchPresetQuestions()    
}

function fetchPresetQuestions() {
    const db = firebase.firestore();
    const courseRef = db.collection('users').doc(currentUserID).collection('courses').doc(currentCourse.id);

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
            // Add any additional logic for when a preset is clicked, if needed
        });
    });
}





