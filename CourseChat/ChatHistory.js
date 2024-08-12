

//Global Variables

/**
 * Builds and appends categorized message thread sections to the given container.
 * @param {HTMLElement} container - The parent element to which sections will be appended.
 * @param {Object} categories - The categorized data for message threads.
 */
function buildSections(container, categories) {
    function renderCategory(category, title) {
        if (category.length > 0) {
            const sectionDiv = createDOMElement('div', 'history-section', '', container);
            createDOMElement('div', 'history-section-title', title, sectionDiv);
            var historySectionItems = createDOMElement('div', 'history-section-items', '', sectionDiv);
            
            category.forEach((thread, index) => {
                const historySectionItem = createDOMElement('div', 'history-section-item', '', historySectionItems);
                // Determine the class based on whether the thread is the last in the list
                const textClass = index === category.length - 1 ? 'history-section-text-last' : 'history-section-text';
                const itemDiv = createDOMElement('div', textClass, thread.previewMessage, historySectionItem);
                historySectionItem.addEventListener('click', () => listenToMessageThread(thread.id));
            });
        }
    }

    // Render each category
    renderCategory(categories.today, 'Today');
    renderCategory(categories.yesterday, 'Yesterday');
    renderCategory(categories.last7Days, 'Last 7 Days');
    renderCategory(categories.previous, 'Previous');
}



function fetchHistory(userId) {
    const userThreadsRef = database.collection('users').doc(userId).collection('courses').doc(currentCourse.id).collection('messageThreads');
    const historyContainer = document.getElementById('history-container');

    userThreadsRef.onSnapshot(snapshot => {
        if (snapshot.empty) {
            console.log('No matching documents.');
            historyContainer.innerHTML = ''; // Clear previous contents
            return;
        }

        const categories = {
            today: [],
            yesterday: [],
            last7Days: [],
            previous: []
        };

        const now = new Date();
        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = new Date(today - 86400000); // 86400000ms = 1 day
        const sevenDaysAgo = new Date(today - 604800000); // 604800000ms = 7 days

        let threads = [];

        snapshot.forEach(doc => {
            const threadData = doc.data();
            if (threadData.status !== 'active') return; // Skip non-active threads
            threadData.dateCreated = new Date(threadData.dateCreated.seconds * 1000); // Convert timestamp to Date
            threads.push(threadData);
        });

        // Sort threads by dateCreated in descending order
        threads.sort((a, b) => b.dateCreated - a.dateCreated);

        // Categorize threads based on the sorted result
        threads.forEach(threadData => {
            if (threadData.dateCreated >= today) {
                categories.today.push(threadData);
            } else if (threadData.dateCreated >= yesterday && threadData.dateCreated < today) {
                categories.yesterday.push(threadData);
            } else if (threadData.dateCreated >= sevenDaysAgo && threadData.dateCreated < yesterday) {
                categories.last7Days.push(threadData);
            } else {
                categories.previous.push(threadData);
            }
        });

        // Clear previous contents
        historyContainer.innerHTML = '';
        
        // Build sections with categorized data
        buildSections(historyContainer, categories);
    }, err => {
        console.log('Error getting documents', err);
    });
}
