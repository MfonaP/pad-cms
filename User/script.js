document.addEventListener('DOMContentLoaded', function() {
    //LANGUAGE DROPDOWN
    const languageDropdownToggle = document.getElementById('languageDropdown');
    const currentLanguageText = document.getElementById('currentLanguageText');
    const languageSelects = document.querySelectorAll('.language-select');

    if (languageDropdownToggle && currentLanguageText && languageSelects.length > 0) {
        languageSelects.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const selectedLang = this.getAttribute('data-lang');
                currentLanguageText.textContent = this.textContent;
                localStorage.setItem('selectedLanguage', selectedLang);
            });
        });
    }

    window.scrollCategory = function(id, scrollAmount) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
            // console.log(`Scrolling ${id} by ${scrollAmount}. Current scrollLeft: ${element.scrollLeft}`); // For debugging
        } else {
            console.warn(`Element with ID '${id}' not found for scrolling. Please check the ID.`);
        }
    };

//QUICK ASSIST MODAL

    const chatMessagesContainer = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const plusButton = document.getElementById('plusButton'); // If you plan to use this later
    const chatbotModal = document.getElementById('chatbotModal');

    // Define predefined questions 
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
        "Contact support": { // A new internal keyword for a direct answer
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

    // Function to append messages to the chat container
    function appendMessage(message, sender, suggestions = []) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message-wrapper'); // Wrapper for message + suggestions

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
                suggestionBtn.setAttribute('data-question', suggestion); // For event listener
                suggestionsDiv.appendChild(suggestionBtn);
            });
            messageWrapper.appendChild(suggestionsDiv);
        }

        chatMessagesContainer.appendChild(messageWrapper);

        // Scroll to the bottom of the chat
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    // Function to handle sending a message (either typed or suggested)
    function sendMessage(question) {
        if (!question.trim()) return; // Don't send empty messages

        appendMessage(question, 'user'); // Add user's message

        // Get bot's response and suggestions
        let botResponseData = chatbotResponses[question] || chatbotResponses['default'];
        if (!botResponseData && !Object.values(chatbotResponses).some(res => res.suggestions && res.suggestions.includes(question))) {
            // Fallback for direct user input not in main keys
            botResponseData = chatbotResponses['default'];
        }

        setTimeout(() => {
            appendMessage(botResponseData.text, 'bot', botResponseData.suggestions);
        }, 500); // Simulate typing delay
    }

    // Event listener for Send button
    if (sendButton && chatInput) {
        sendButton.addEventListener('click', function() {
            sendMessage(chatInput.value);
            chatInput.value = ''; // Clear input field
        });

        // Event listener for Enter key in input field
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent new line in input
                sendMessage(chatInput.value);
                chatInput.value = '';
            }
        });
    }

    // Event listener for clicking on suggested questions
    if (chatMessagesContainer) { // Attach to parent for delegated events
        chatMessagesContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('suggestion-btn')) {
                const suggestedQuestion = event.target.dataset.question;
                sendMessage(suggestedQuestion);
            }
        });
    }


    // Reset chat when modal is hidden
    if (chatbotModal) {
        chatbotModal.addEventListener('hidden.bs.modal', function () {
            // Clear all messages except the initial greeting
            chatMessagesContainer.innerHTML = ''; // Clear everything
            appendMessage(chatbotResponses['greeting'].text, 'bot', chatbotResponses['greeting'].suggestions); // Re-add initial greeting and suggestions
            chatInput.value = ''; // Clear input field
        });

        // Show initial greeting when modal is first shown
        chatbotModal.addEventListener('shown.bs.modal', function () {
            if (chatMessagesContainer.children.length === 0) { // Only if chat is empty
                appendMessage(chatbotResponses['greeting'].text, 'bot', chatbotResponses['greeting'].suggestions);
            }
        });
    }
  });