
const translations = {
    en: {
        articlesPageTitle: "Articles - CMS PAD",
        articlesHeroTitle: "Articles",
        articlesHeroText: "Explore all our insightful articles",
        nutritionSectionHeading: "Nutrition",
        healthWellnessSectionHeading: "Health and Wellness",
        safetySectionHeading: "Safety",
        seeAllNutrition: "See All",
        seeAllHealth: "See All",
        seeAllSafety: "See All",
        seeAll: "See All",
        home: "Home",
        categories: "Categories",
        contact: "Contact",
        help: "Help",
        chatbotFooterText: "© 2025 PAD. All rights reserved.",
        footerText: "© PAD 2025 ALL rights reserved.",
        noArticlesFound: "No articles found in this category."
    },
    fr: {
        articlesPageTitle: "Articles - CMS PAD",
        articlesHeroTitle: "Articles",
        articlesHeroText: "Explorez tous nos articles perspicaces",
        nutritionSectionHeading: "Nutrition",
        healthWellnessSectionHeading: "Santé et Bien-être",
        safetySectionHeading: "Sécurité",
        seeAllNutrition: "Voir Tout",
        seeAllHealth: "Voir Tout",
        seeAllSafety: "Voir Tout",
        seeAll: "Voir Tout",
        home: "Accueil",
        categories: "Catégories",
        contact: "Contact",
        help: "Aide",
        chatbotFooterText: "© 2025 PAD. Tous droits réservés.",
        footerText: "© PAD 2025 Tous droits réservés.",
        noArticlesFound: "Aucun article trouvé dans cette catégorie."
    }
};

// --- Language Handling Function ---
function setLanguage(lang) {
    const elements = document.querySelectorAll('[data-lang-key]');
    elements.forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    const currentLanguageText = document.getElementById('currentLanguageText');
    if (currentLanguageText) {
        currentLanguageText.textContent = lang === 'en' ? 'English' : 'French';
    }
    localStorage.setItem('selectedLanguage', lang);
}

// --- Article Card Creation Function
function createArticleCardHTML(article, docId) {
    const descriptionText = article.description && article.description.trim() !== ''
        ? article.description
        : (article.content ? article.content.substring(0, 150) + '...' : '');

    return `
        <div class="col-md-4 mb-4">
            <div class="card h-100 shadow-sm article-card">
                ${article.imageUrl ? `<img src="${article.imageUrl}" class="card-img-top article-card-img" alt="${article.title}">` : ''}
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title article-card-title">${article.title}</h5>
                    <p class="card-text text-muted small">${article.createdAt ? new Date(article.createdAt.toDate()).toLocaleDateString() : 'No date'} | Category: ${article.category || 'Uncategorized'}</p>
                    <p class="card-text article-card-text flex-grow-1">${descriptionText}</p>
                    <a href="Article-Details.html?id=${docId}" class="btn btn-primary mt-auto article-card-btn">Read More</a>
                </div>
            </div>
        </div>
    `;
}

// --- Load Articles Function ---
async function loadArticles(containerId, collectionName, category = null, limitCount = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID "${containerId}" not found for ${category || 'all'} articles.`);
        return;
    }

    console.log(`Attempting to load for container: ${containerId}, category: ${category}, db status: ${typeof db !== 'undefined' && db !== null ? 'OK' : 'NOT OK'}`);
   
    container.innerHTML = '<p class="text-center col-12" data-lang-key="loadingArticles">Loading articles...</p>';
    setLanguage(localStorage.getItem('selectedLanguage') || 'en'); 

    if (typeof db === 'undefined' || db === null) {
        console.error("Firestore 'db' object is not defined. Cannot load articles.");
        container.innerHTML = '<p class="text-center text-danger col-12">Failed to connect to database. Please check console.</p>';
        return;
    }

    try {
        let query = db.collection(collectionName).where("status", "==", true); 

        if (category) {
            query = query.where("category", "==", category);
        }

        query = query.orderBy("createdAt", "desc"); 

        if (limitCount) {
            query = query.limit(limitCount);
        }

        const snapshot = await query.get();

        container.innerHTML = ''; 

        if (snapshot.empty) {
            container.innerHTML = '<p class="text-center text-muted col-12" data-lang-key="noArticlesFound">No articles found in this category.</p>';
            setLanguage(localStorage.getItem('selectedLanguage') || 'en'); // Apply translation
            return;
        }

        snapshot.forEach(doc => {
            const article = doc.data();
            const articleHtml = createArticleCardHTML(article, doc.id);
            container.insertAdjacentHTML('beforeend', articleHtml);
        });

        setLanguage(localStorage.getItem('selectedLanguage') || 'en'); 

    } catch (error) {
        console.error("Error loading articles:", error);
        container.innerHTML = `<p class="text-danger col-12">Error loading articles. Please check console.</p>`;
    }
}

async function loadDoctorNotes(containerId) {
    const containerElement = document.getElementById(containerId);
    if (!containerElement) {
        console.error(`Container with ID "${containerId}" not found for doctor notes.`);
        return;
    }
    if (typeof db === 'undefined' || db === null) {
        console.error("Firestore 'db' object is not defined. Cannot load doctor notes.");
        containerElement.innerHTML = '<p class="text-center text-danger col-12">Failed to connect to database. Please check console.</p>';
        return;
    }

    containerElement.innerHTML = '<p class="text-center col-12">Loading doctors note...</p>';

    try {
        const snapshot = await db.collection("doctorNotes")
            .where("status", "==", true)
            .orderBy("createdAt", "desc") 
            .get();

        containerElement.innerHTML = '';

        if (snapshot.empty) {
            containerElement.innerHTML = '<p class="text-center text-muted col-12">No doctor notes published yet.</p>';
            return;
        }

        const latestNoteDoc = snapshot.docs[0];
        if (latestNoteDoc) {
            const note = latestNoteDoc.data();
            const noteDate = note.createdAt ? new Date(note.createdAt.toDate()).toLocaleDateString() : 'N/A';

            
            const noteHtml = `
                <div class="doctor-note-display">
                    <h6>${note.title}</h6>
                    <p class="text-muted small">${noteDate}</p>
                    <p>${note.content.substring(0, 300)}...</p> 
                </div>
            `;
            containerElement.insertAdjacentHTML('beforeend', noteHtml);
        } else {
             containerElement.innerHTML = '<p class="text-center text-muted col-12">No doctor notes published yet.</p>';
        }
    } catch (error) {
        console.error("Error loading doctor notes:", error);
        containerElement.innerHTML = '<p class="text-center text-danger col-12">Failed to load doctor notes.</p>';
    }
}

//  Load Single Article Detail Function ---
async function loadArticleDetailsAndRelated() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    const articleTitleEl = document.getElementById('article-title');
    const articleCategoryEl = document.getElementById('article-category');
    const articleDateEl = document.getElementById('article-date');
    const articleImageEl = document.getElementById('article-main-image');
    const articleFullTextEl = document.getElementById('article-full-text');

    if (!articleId) {
        console.error("Article ID not found in URL.");
        if (articleTitleEl) articleTitleEl.textContent = 'Error: Article ID Missing';
        if (articleFullTextEl) articleFullTextEl.innerHTML = '<p>Please go back to the articles list and select an article.</p>';
        if (articleImageEl) articleImageEl.style.display = 'none';
        if (articleCategoryEl) articleCategoryEl.parentElement.style.display = 'none';
        return;
    }

    
    if (typeof db === 'undefined' || db === null) {
        console.error("Failed to connect to database: Firestore instance is undefined or null.");
        if (articleTitleEl) articleTitleEl.textContent = 'Error: Database Connection Failed';
        if (articleFullTextEl) articleFullTextEl.innerHTML = '<p>Failed to connect to database. Please check console for more details.</p>';
        return;
    }

    try {
        const docRef = db.collection("articles").doc(articleId);
        const docSnap = await docRef.get();

        if (docSnap.exists && docSnap.data().status === true) {
            const article = docSnap.data();

            
            if (articleTitleEl) articleTitleEl.textContent = article.title || 'Untitled Article';
            if (articleCategoryEl) articleCategoryEl.textContent = article.category || 'Uncategorized';
            
            if (articleDateEl && article.createdAt && typeof article.createdAt.toDate === 'function') {
                articleDateEl.textContent = new Date(article.createdAt.toDate()).toLocaleDateString();
            } else if (articleDateEl) {
                articleDateEl.textContent = 'N/A';
            }

            if (articleImageEl) {
                articleImageEl.src = article.imageUrl || ''; 
                articleImageEl.alt = article.title || 'Article Image';
            }
            
            if (articleFullTextEl) {
                articleFullTextEl.innerHTML = article.content ? article.content.replace(/\n/g, '<br>') : '<p>No content available for this article.</p>';
            }

            // Call the function to load related articles
            await loadRelatedArticles(article.category, docSnap.id);

        } else {
            console.error(`No such article with ID: ${articleId} or not published (status is not true).`);
            if (articleTitleEl) articleTitleEl.textContent = 'Error: Article Not Found or Not Published';
            if (articleFullTextEl) articleFullTextEl.innerHTML = '<p>The requested article could not be found or is not yet published.</p>';
            if (articleImageEl) articleImageEl.style.display = 'none';
            if (articleCategoryEl) articleCategoryEl.parentElement.style.display = 'none';
        }
    } catch (error) {
        console.error("Error loading article detail:", error);
        if (articleTitleEl) articleTitleEl.textContent = 'Error Loading Article';
        if (articleFullTextEl) articleFullTextEl.innerHTML = '<p>An error occurred while trying to load the article details. Please check the console for more information.</p>';
        if (articleImageEl) articleImageEl.style.display = 'none';
        if (articleCategoryEl) articleCategoryEl.parentElement.style.display = 'none';
    }
}

async function loadRelatedArticles(currentCategory, currentArticleId) {
    const relatedArticlesContainer = document.getElementById('related-articles-container');
    if (!relatedArticlesContainer) {
        console.error("Related articles container not found.");
        return;
    }
    relatedArticlesContainer.innerHTML = ''; 

    try {
        const querySnapshot = await db.collection('articles')
                                      .where('category', '==', currentCategory)
                                      .where('status', '==', true) 
                                      .limit(4) 
                                      .get();

        let related = [];
        querySnapshot.forEach(doc => {
            if (doc.id !== currentArticleId) { 
                related.push({ id: doc.id, ...doc.data() });
            }
        });

        related = related.slice(0, 2); 

        if (related.length > 0) {
            related.forEach(article => {
                const articleCard = document.createElement('div');
                articleCard.classList.add('article-card');
                articleCard.classList.add('col-md-4', 'mb-4'); 
                articleCard.innerHTML = `
                    <div class="card h-100 shadow-sm article-card">
                        ${article.imageUrl ? `<img src="${article.imageUrl}" class="card-img-top article-card-img" alt="${article.title || 'Related Article Image'}">` : ''}
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title article-card-title">${article.title || 'Untitled Related Article'}</h5>
                            <p class="card-text text-muted small">Category: ${article.category || 'N/A'}</p>
                            <a href="./Article-Details.html?id=${article.id}" class="btn btn-primary mt-auto article-card-btn">Read More</a>
                        </div>
                    </div>
                `;
                relatedArticlesContainer.appendChild(articleCard);
            });
        } else {
            relatedArticlesContainer.innerHTML = '<p class="col-12 text-center">No other published articles found in this category.</p>';
        }
    } catch (error) {
        console.error("Error fetching related articles from Firestore:", error);
        relatedArticlesContainer.innerHTML = '<p class="col-12 text-center text-danger">Could not load related articles.</p>';
    }
}


// --- Main DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', function() {
    const languageDropdownToggle = document.getElementById('languageDropdown');
    const currentLanguageText = document.getElementById('currentLanguageText');
    const languageSelects = document.querySelectorAll('.language-select');

    if (languageDropdownToggle && currentLanguageText && languageSelects.length > 0) {
        languageSelects.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const selectedLang = this.getAttribute('data-lang');
                setLanguage(selectedLang); 
            });
        });
    }

    // Apply saved language or default to English
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    setLanguage(savedLanguage);
    if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
        console.error("Firebase not initialized in HTML. Cannot fetch public content.");
        return;
    }

async function loadArticleDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    const titleElement = document.getElementById('article-detail-title');
    const categoryElement = document.getElementById('article-detail-category');
    const dateElement = document.getElementById('article-detail-date');
    const imageElement = document.getElementById('article-detail-image');
    const contentElement = document.getElementById('article-detail-content');
    const errorElement = document.getElementById('article-detail-error');
    const pageTitleElement = document.getElementById('articlePageTitle');

    if (!articleId) {
        console.error("No article ID found in URL.");
        if (errorElement) {
            errorElement.textContent = "No article specified.";
            errorElement.classList.remove('d-none');
        }
        if (titleElement) titleElement.textContent = "Article Not Found";
        if (contentElement) contentElement.innerHTML = "<p>Please ensure you have a valid article ID in the URL (e.g., `article-details.html?id=YOUR_ARTICLE_ID`).</p>";
        return;
    }

    try {
        if (typeof db === 'undefined' || db === null) {
            throw new Error("Firestore 'db' object is not defined.");
        }

        const docRef = db.collection('articles').doc(articleId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const article = docSnap.data();
            console.log("Article data loaded:", article);

            if (titleElement) titleElement.textContent = article.title || 'Untitled Article';
            if (categoryElement) categoryElement.textContent = article.category || 'Uncategorized';
            if (dateElement) {
                if (article.createdDate && article.createdAt.toDate) { // Check if it's a Firestore Timestamp
                    dateElement.textContent = new Date(article.createdAt.toDate()).toLocaleDateString();
                } else if (article.createdDate) { // Assume it's already a string or valid date format
                    dateElement.textContent = new Date(article.createdDate).toLocaleDateString();
                } else {
                    dateElement.textContent = 'N/A';
                }
            }
            if (imageElement) imageElement.src = article.imageUrl || 'https://via.placeholder.com/800x450?text=No+Image';
            if (contentElement) contentElement.innerHTML = article.content || '<p>No content available.</p>'; // Use innerHTML for rich text

            if (pageTitleElement) pageTitleElement.textContent = article.title ? `${article.title} - Article Details` : "Article Details";

            if (errorElement) errorElement.classList.add('d-none'); // Hide error if successful

        } else {
            console.warn("No such article document!");
            if (errorElement) {
                errorElement.textContent = "Article not found.";
                errorElement.classList.remove('d-none');
            }
            if (titleElement) titleElement.textContent = "Article Not Found";
            if (contentElement) contentElement.innerHTML = "<p>The article you are looking for does not exist.</p>";
            if (imageElement) imageElement.src = "https://via.placeholder.com/800x450?text=Article+Not+Found";
            if (pageTitleElement) pageTitleElement.textContent = "Article Not Found";
        }
    } catch (error) {
        console.error("Error fetching article:", error);
        if (errorElement) {
            errorElement.textContent = `Error loading article: ${error.message}`;
            errorElement.classList.remove('d-none');
        }
        if (titleElement) titleElement.textContent = "Error Loading Article";
        if (contentElement) contentElement.innerHTML = "<p>An error occurred while trying to load the article. Please try again later.</p>";
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'article-details.html') { 
        console.log('Article Details page loading initiated.');
        loadArticleDetail();
    }
    
});
    // --- PAGE DETECTION AND CONTENT LOADING
    const currentPage = window.location.pathname.split('/').pop();
    console.log('Current Page Detected:', currentPage); 

    if (currentPage === 'Home.html' || currentPage === '') {
        loadArticles('safety-articles-container', 'articles', 'Safety', 3);
        loadDoctorNotes('home-doctor-note-content', 2);
        console.log('Home page article loading initiated.');
    } else if (currentPage === 'Nutrition.html') {
        loadArticles('nutrition-articles-container', 'articles', 'Nutrition');
        console.log('Nutrition category page article loading initiated.');
    } else if (currentPage === 'Health.html') {
        loadArticles('health-sleep-rest-articles-container', 'articles', 'Health and Wellness');
        loadArticles('health-mental-health-articles-container', 'articles', 'Health and Wellness');
        loadArticles('health-fitness-movement-articles-container', 'articles', 'Health and Wellness');
        console.log('Health category page article loading initiated.');
    } else if (currentPage === 'Safety.html') {
        loadArticles('hazard-awareness-cards', 'articles', 'Safety');
        loadArticles('responding-emergencies-cards', 'articles', 'Safety');
        
        console.log('Safety category page article loading initiated.');
    } else if (currentPage === 'Articles.html') {
        loadArticles('articles-page-nutrition-section', 'articles', 'Nutrition');
        loadArticles('articles-page-health-section', 'articles', 'Health and Wellness');
        loadArticles('articles-page-safety-section', 'articles', 'Safety');
        console.log('All Articles page loading initiated.');

        htmlContent += `
    <li class="list-group-item d-flex align-items-center">
        <img src="${article.imageUrl || 'path/to/placeholder.jpg'}" alt="${article.title}" class="img-thumbnail me-3" style="width: 80px; height: 80px; object-fit: cover;">
        <div class="flex-grow-1">
            <h6>${article.title}</h6>
            <p class="mb-1 text-muted small">${article.category} | ${articleDate}</p>
            <span class="badge ${statusClass}">${statusText}</span>
        </div>
        <div class="ms-auto">
            <a href="article-details.html?id=${doc.id}" class="btn btn-sm btn-outline-info me-2">View</a>
            <a href="edit-article.html?id=${doc.id}" class="btn btn-sm btn-outline-primary me-2">Edit</a>
            <button class="btn btn-sm btn-outline-danger" data-article-id="${doc.id}" onclick="deleteArticle('${doc.id}')">Delete</button>
        </div>
    </li>
`;
    
    }


    // Contact Form Submission 
    console.log("DOMContentLoaded fired."); 
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    
    console.log("contactForm element found:", contactForm); // New log
    console.log("formMessage element found:", formMessage); // New log

    if (contactForm) { 
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            console.log("Form submit event fired.");

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            console.log("Form data:", { name, email, message });
            
            if (!name || !email || !message) {
                formMessage.innerHTML = '<div class="alert alert-danger" role="alert">Please fill in all fields.</div>';
                console.log("Validation failed: fields empty."); 
                return;
            }

            formMessage.innerHTML = '<div class="alert alert-info" role="alert">Sending message...</div>';
            console.log("Attempting to send to Firestore...");

            try {
                if (typeof db === 'undefined' || db === null) {
                    throw new Error("Firestore 'db' object is not defined.");
                }
                console.log("db object is defined. Proceeding with Firestore add."); 

                await db.collection('contactSubmissions').add({
                    name: name,
                    email: email,
                    message: message,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(), 
                    read: false // Mark as unread by default
                });

                formMessage.innerHTML = '<div class="alert alert-success" role="alert">Your message has been sent successfully!</div>';
                contactForm.reset(); 
                console.log("Message sent successfully."); 
            } catch (error) {
                console.error("Error sending message:", error);
                formMessage.innerHTML = `<div class="alert alert-danger" role="alert">Error sending message: ${error.message}</div>`;
            }
        });
    
    }

    // --- QUICK ASSIST MODAL 
    const chatMessagesContainer = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const chatbotModal = document.getElementById('chatbotModal');
    
    let functions; 
    if (typeof firebase !== 'undefined' && typeof firebase.functions === 'function') {
        functions = firebase.functions();

        console.log("Firebase Functions SDK initialized for chatbot.");
    } else {
        console.error("Firebase Functions SDK is not loaded or initialized. Chatbot AI features will be disabled.");
        if (chatInput) chatInput.disabled = true;
        if (sendButton) sendButton.disabled = true;
        return; 
    }

    // --- Rule-Based Chatbot Responses
    const chatbotResponses = {
        "greeting": {
            text: "Hello! How can I help you today?",
            suggestions: [
                "What is PAD-CMS?",
                "Where can I find articles?",
                "How can I contact support?"
            ]
        },
        "What is PAD-CMS?": {
            text: "PAD-CMS is a comprehensive platform focused on health, wellness, nutrition, and safety articles. We provide valuable insights and information to help you live a healthier and safer life.",
            suggestions: [
                "What services do you offer?",
                "Contact support"
            ]
        },
        "Where can I find articles?": {
            text: "You can find all our articles by navigating to the 'Articles' section from the main menu, or by Browse specific categories like 'Nutrition', 'Health and Wellness', and 'Safety'.",
            suggestions: [
                "What is PAD-CMS?",
                "How can I contact support?"
            ]
        },
        "How can I contact support?": {
            text: "You can reach our support team through the 'Contact Us' page. We offer contact details and a direct messaging form for your convenience. Alternatively, you can call us at 555-555-555.",
            suggestions: [
                "What services do you offer?",
                "Back to main questions"
            ]
        },
        "What services do you offer?": {
            text: "We primarily offer informational content in the form of articles across various health and safety domains. We also feature resources and community insights.",
            suggestions: [
                "What is PAD-CMS?",
                "Contact support"
            ]
        },
        "Contact support": {
            text: "Please visit our Contact Us page for various ways to get in touch.",
            suggestions: ["Back to main questions"]
        },
        "Back to main questions": {
            text: "What else can I help you with?",
            suggestions: [
                "What is PAD-CMS?",
                "Where can I find articles?",
                "How can I contact support?"
            ]
        },
        
    };

    // appendMessage function ---
    function appendMessage(message, sender, suggestions = []) {
        if (!chatMessagesContainer) return;

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper');

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `${sender}-message`);
        messageDiv.innerHTML = message;
        messageWrapper.appendChild(messageDiv);

        if (suggestions.length > 0 && sender === 'bot') {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.classList.add('chat-suggestions');
            suggestions.forEach(suggestion => {
                const suggestionBtn = document.createElement('button');
                suggestionBtn.classList.add('btn', 'btn-outline-secondary', 'btn-sm', 'suggestion-btn');
                suggestionBtn.textContent = suggestion;
                suggestionBtn.setAttribute('data-question', suggestion);
                suggestionsDiv.appendChild(suggestionBtn);
            });
            messageWrapper.appendChild(suggestionsDiv);
        }

        chatMessagesContainer.appendChild(messageWrapper);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    //  Function to send message to Gemini via Cloud Function
    async function sendMessageToGemini(userMessage) {
        // Show a loading indicator
        const loadingMessageDiv = document.createElement('div');
        loadingMessageDiv.classList.add('chat-message', 'bot-message', 'loading-indicator');
        loadingMessageDiv.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Thinking...';
        chatMessagesContainer.appendChild(loadingMessageDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

        try {
            const chatWithGeminiFunction = functions.httpsCallable('chatWithGemini');
            const result = await chatWithGeminiFunction({ message: userMessage });

            // Remove the loading indicator
            if (chatMessagesContainer.contains(loadingMessageDiv)) {
                chatMessagesContainer.removeChild(loadingMessageDiv);
            }

            // Display Gemini's response. No suggestions for AI-generated responses.
            const botResponse = result.data.text;
            appendMessage(botResponse, 'bot'); // No suggestions for Gemini responses

        } catch (error) {
            console.error("Error calling Gemini function:", error);
            // Remove the loading indicator even on error
            if (chatMessagesContainer.contains(loadingMessageDiv)) {
                chatMessagesContainer.removeChild(loadingMessageDiv);
            }
            appendMessage('bot', 'Oops! Something went wrong with the AI. Please try again later.');
        }
    }


    // --- MODIFIED: sendMessage function to prioritize rule-based or call Gemini ---
    async function sendMessage(question) { // Made async because it will call sendMessageToGemini
        const trimmedQuestion = question.trim();
        if (!trimmedQuestion) return;

        appendMessage(trimmedQuestion, 'user');
        chatInput.value = ''; // Clear input immediately

        // Check if the question matches a predefined rule
        const botResponseData = chatbotResponses[trimmedQuestion];

        if (botResponseData) {
            // If it matches a rule, use the rule-based response
            setTimeout(() => {
                appendMessage(botResponseData.text, 'bot', botResponseData.suggestions);
            }, 500); // Slight delay for a more natural feel
        } else {
            // If no rule matches, send to Gemini AI
            await sendMessageToGemini(trimmedQuestion);
        }
    }

    // --- Your existing Event Listeners ---
    if (sendButton && chatInput) {
        sendButton.addEventListener('click', function() {
            sendMessage(chatInput.value);
            
        });
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage(chatInput.value);
                
            }
        });
    }

    if (chatMessagesContainer) {
        chatMessagesContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('suggestion-btn')) {
                const suggestedQuestion = event.target.dataset.question;
                sendMessage(suggestedQuestion);
            }
        });
    }

    // --- Modal Show/Hide Logic (Your existing logic) ---
    if (chatbotModal) {
        chatbotModal.addEventListener('hidden.bs.modal', function() {
            chatMessagesContainer.innerHTML = '';
            
            appendMessage(chatbotResponses['greeting'].text, 'bot', chatbotResponses['greeting'].suggestions);
            chatInput.value = ''; // Clear input on close
        });
        chatbotModal.addEventListener('shown.bs.modal', function() {
            if (chatMessagesContainer.children.length === 0 ||
                (chatMessagesContainer.children.length === 1 && chatMessagesContainer.firstElementChild.classList.contains('chat-message') && chatMessagesContainer.firstElementChild.textContent === 'Hello! How can I help you today?')) {
                appendMessage(chatbotResponses['greeting'].text, 'bot', chatbotResponses['greeting'].suggestions);
            }
            chatInput.focus(); 
        });
    }
    
}); // END of DOMContentLoaded

// SCROLL CATEGORY FUNCTION 
window.scrollCategory = function(id, scrollAmount) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    } else {
        console.warn(`Element with ID '${id}' not found for scrolling. Please check the ID.`);
    }
};