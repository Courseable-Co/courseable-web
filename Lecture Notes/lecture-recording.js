



document.addEventListener('DOMContentLoaded', function() {
    const recordButton = document.getElementById('recordButton');
    const transcriptionDiv = document.getElementById('transcription');
    let isRecording = false;
    let recognition;

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
        recognition = new SpeechRecognition();
    } else {
        alert("Sorry, your browser doesn't support the Web Speech API.");
    }

    if (recognition) {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = function(event) {
            let interimTranscription = '';
            let finalTranscription = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscription += event.results[i][0].transcript;
                } else {
                    interimTranscription += event.results[i][0].transcript;
                }
            }
            transcriptionDiv.innerHTML = `<strong>Final: </strong>${finalTranscription}<br><strong>Interim: </strong>${interimTranscription}`;
        };

        recognition.onerror = function(event) {
            console.error("Speech recognition error", event.error);
        };

        recognition.onend = function() {
            if (isRecording) {
                recognition.start();
            }
        };

        recordButton.addEventListener('click', function() {
            if (isRecording) {
                recognition.stop();
                recordButton.textContent = 'Start Recording';
            } else {
                recognition.start();
                recordButton.textContent = 'Stop Recording';
            }
            isRecording = !isRecording;
        });
    }
});
