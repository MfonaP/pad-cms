// script.js

// Global variable for Firestore (assumed to be initialized in HTML)
 //const db = firebase.firestore(); // This line should be in your HTML after firebase.initializeApp()

// --- Translation Data ---
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

// --- Article Card Creation Function (Helper for loadArticles) ---
function createArticleCardHTML(article, docId) {
    // Use shortDescription if available, otherwise fallback to a substring of fullContent
    const descriptionText = article.description && article.description.trim() !== ''
        ? article.description
        : (article.fullContent ? article.fullContent.substring(0, 150) + '...' : '');

    return `
        <div class="col-md-4 mb-4">
            <div class="card h-100 shadow-sm article-card">
                ${article.imageUrl ? `<img src="${article.imageUrl}" class="card-img-top article-card-img" alt="${article.title}">` : ''}
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title article-card-title">${article.title}</h5>
                    <p class="card-text text-muted small">${article.createdAt ? new Date(article.createdAt.toDate()).toLocaleDateString() : 'No date'} | Category: ${article.category || 'Uncategorized'}</p>
                    <p class="card-text article-card-text flex-grow-1">${descriptionText}</p>
                    <a href="article-details.html?id=${docId}" class="btn btn-primary mt-auto article-card-btn">Read More</a>
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
    setLanguage(localStorage.getItem('selectedLanguage') || 'en'); // Apply loading message translation

    // Ensure db is defined from the HTML script before trying to use it
    if (typeof db === 'undefined' || db === null) {
        console.error("Firestore 'db' object is not defined. Cannot load articles.");
        container.innerHTML = '<p class="text-center text-danger col-12">Failed to connect to database. Please check console.</p>';
        return;
    }

    try {
        let query = db.collection(collectionName).where("status", "==", true); // Only published articles

        if (category) {
            query = query.where("category", "==", category);
        }

        query = query.orderBy("createdAt", "desc"); 

        if (limitCount) {
            query = query.limit(limitCount);
        }

        const snapshot = await query.get();

        container.innerHTML = ''; // Clear loading message

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

        setLanguage(localStorage.getItem('selectedLanguage') || 'en'); // Re-apply language to newly added dynamic content

    } catch (error) {
        console.error("Error loading articles:", error);
        container.innerHTML = `<p class="text-danger col-12">Error loading articles. Please check console.</p>`;
    }
}

// --- Optional: Load Doctor Notes Function ---
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

// --- Optional: Load Single Article Detail Function ---
/*async function loadArticleDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    const articleDetailContainer = document.getElementById('article-detail-container');

    if (!articleId || !articleDetailContainer) {
        if (articleDetailContainer) {
            articleDetailContainer.innerHTML = '<p class="text-center text-danger col-12">Article not found or ID missing.</p>';
        }
        return;
    }
    if (typeof db === 'undefined' || db === null) {
        articleDetailContainer.innerHTML = '<p class="text-center text-danger col-12">Failed to connect to database. Please check console.</p>';
        return;
    }

    try {
        const doc = await db.collection("articles").doc(articleId).get();
        if (doc.exists && doc.data().status === true) {
            const article = doc.data();
            const detailHtml = `
                <div class="col-12">
                    <h1 class="mb-4">${article.title}</h1>
                    <p class="text-muted small">Published on: ${article.createdAt ? new Date(article.createdAt.toDate()).toLocaleDateString() : 'N/A'} | Category: ${article.category || 'Uncategorized'}</p>
                    ${article.imageUrl ? `<img src="${article.imageUrl}" class="img-fluid mb-4 rounded" alt="${article.title}">` : ''}
                    <div class="lead">${article.fullContent ? article.fullContent.replace(/\n/g, '<br>') : ''}</div>
                </div>
            `;
            articleDetailContainer.innerHTML = detailHtml;
        } else {
            articleDetailContainer.innerHTML = '<p class="text-center text-danger col-12">Article not found or not published.</p>';
        }
    } catch (error) {
        console.error("Error loading article detail:", error);
        articleDetailContainer.innerHTML = '<p class="text-center text-danger col-12">Failed to load article details.</p>';
    }
}

// --- Optional: Load Single Doctor Note Detail Function ---
async function loadDoctorNoteDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('id');
    const noteDetailContainer = document.getElementById('doctor-note-detail-container');

    if (!noteId || !noteDetailContainer) {
        if (noteDetailContainer) {
            noteDetailContainer.innerHTML = '<p class="text-center text-danger col-12">Doctor note not found or ID missing.</p>';
        }
        return;
    }
    if (typeof db === 'undefined' || db === null) {
        noteDetailContainer.innerHTML = '<p class="text-center text-danger col-12">Failed to connect to database. Please check console.</p>';
        return;
    }

    try {
        const doc = await db.collection("doctorNotes").doc(noteId).get();
        if (doc.exists && doc.data().status === true) {
            const note = doc.data();
            const detailHtml = `
                <div class="col-12">
                    <h1 class="mb-4">${note.title}</h1>
                    <p class="text-muted small">Date: ${note.createdAt? new Date(note.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                    <div class="lead">${note.content ? note.content.replace(/\n/g, '<br>') : ''}</div>
                </div>
            `;
            noteDetailContainer.innerHTML = detailHtml;
        } else {
            noteDetailContainer.innerHTML = '<p class="text-center text-danger col-12">Doctor note not found or not published.</p>';
        }
    } catch (error) {
        console.error("Error loading doctor note detail:", error);
        noteDetailContainer.innerHTML = '<p class="text-center text-danger col-12">Failed to load doctor note details.</p>';
    }
}*/


// --- Main DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', function() {
    // LANGUAGE DROPDOWN setup (Moved to top as it's common)
    const languageDropdownToggle = document.getElementById('languageDropdown');
    const currentLanguageText = document.getElementById('currentLanguageText');
    const languageSelects = document.querySelectorAll('.language-select');

    if (languageDropdownToggle && currentLanguageText && languageSelects.length > 0) {
        languageSelects.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const selectedLang = this.getAttribute('data-lang');
                setLanguage(selectedLang); // Use the setLanguage function
            });
        });
    }

    // Apply saved language or default to English
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    setLanguage(savedLanguage);

    // --- Firebase Initialization Check (Your original block, slightly adjusted) ---
    // This assumes Firebase has already been initialized in the HTML <script> block
    if (typeof firebase === 'undefined' || firebase.apps.length === 0) {
        console.error("Firebase not initialized in HTML. Cannot fetch public content.");
        // You might want to display a user-friendly message on the page if Firebase isn't ready
        return; // Exit if Firebase isn't set up
    }
    // console.log("Firestore initialized for public side."); // Keep if you like, but it's redundant if db check is there

    // --- PAGE DETECTION AND CONTENT LOADING LOGIC (CRUCIAL FIXES HERE) ---
    const currentPage = window.location.pathname.split('/').pop();
    console.log('Current Page Detected:', currentPage); // THIS IS THE CRUCIAL LOG

    if (currentPage === 'Home.html' || currentPage === '') {
        // Assuming your Home.html has these containers and categories (adjust IDs as needed)
        //loadArticles('nutrition-articles-container', 'articles', 'Nutrition', 3);
        //loadArticles('health-articles-container', 'articles', 'Health and Wellness', 3);
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
    /*} else if (currentPage === 'article-details.html') { // The actual page name for a single article view
        loadArticleDetail();
        console.log('Single article detail loading initiated.');
    } else if (currentPage === 'doctor-notes.html') { // Assuming you create a page for all doctor notes
        loadDoctorNotes('home-doctor-note-content'); // Pass the ID of the container on doctor-notes.html
        console.log('Doctor notes listing loading initiated.');
    } else if (currentPage === 'doctor-note-detail.html') { // The actual page name for a single doctor note view
        loadDoctorNoteDetail();
        console.log('Single doctor note detail loading initiated.');*/
    }
    // No 'else' needed for pages not handled here.


    // Contact Form Submission 
    console.log("DOMContentLoaded fired."); // New log
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
                console.log("db object is defined. Proceeding with Firestore add."); // New log

                await db.collection('contactSubmissions').add({
                    name: name,
                    email: email,
                    message: message,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Firestore timestamp
                    read: false // Mark as unread by default
                });

                formMessage.innerHTML = '<div class="alert alert-success" role="alert">Your message has been sent successfully!</div>';
                contactForm.reset(); 
                console.log("Message sent successfully."); // New log
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
    // plusButton is not used in the provided code, so removed its element reference.

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
                "Contact support"
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
        "default": {
            text: "I'm sorry, I don't have an answer for that specific question. Please try one of the suggestions or rephrase your question. You can also visit our Contact page for more assistance.",
            suggestions: [
                "What is PAD-CMS?",
                "Where can I find articles?",
                "How can I contact support?"
            ]
        }
    };

    function appendMessage(message, sender, suggestions = []) {
        if (!chatMessagesContainer) return; // Guard clause if chatbot elements aren't present

        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper');

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `${sender}-message`);
        messageDiv.textContent = message;
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

    function sendMessage(question) {
        if (!question.trim()) return;

        appendMessage(question, 'user');

        let botResponseData = chatbotResponses[question] || chatbotResponses['default'];

        setTimeout(() => {
            appendMessage(botResponseData.text, 'bot', botResponseData.suggestions);
        }, 500);
    }

    if (sendButton && chatInput) {
        sendButton.addEventListener('click', function() {
            sendMessage(chatInput.value);
            chatInput.value = '';
        });
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage(chatInput.value);
                chatInput.value = '';
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

    if (chatbotModal) {
        chatbotModal.addEventListener('hidden.bs.modal', function() {
            chatMessagesContainer.innerHTML = '';
            appendMessage(chatbotResponses['greeting'].text, 'bot', chatbotResponses['greeting'].suggestions);
            chatInput.value = '';
        });
        chatbotModal.addEventListener('shown.bs.modal', function() {
            if (chatMessagesContainer.children.length === 0) {
                appendMessage(chatbotResponses['greeting'].text, 'bot', chatbotResponses['greeting'].suggestions);
            }
        });
    }
}); // END of DOMContentLoaded

// SCROLL CATEGORY FUNCTION (window.scrollCategory - kept as global)
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