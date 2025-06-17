// --- 0. Firestore Initialization (MUST BE AT THE VERY TOP) ---
// This line needs to be global or accessible where 'db' is used.
// If you have firebase.initializeApp(firebaseConfig); in your adminDashboard.html,
// ensure const db = firebase.firestore(); is also there right after it.
// If you're putting it all in script.js, it should be here:
const db = firebase.firestore(); 

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. DOM Element Declarations (ALL ELEMENTS HERE FOR CLARITY) ---
    // These should be declared once the DOM is ready.
    const dashboardContentDiv = document.getElementById('dashboardContent');
    const dashboardLink = document.getElementById('dashboardLink');
    const doctorNoteLink = document.getElementById('doctorNoteLink');
    const allArticlesLink = document.getElementById('allArticlesLink');
    const settingsLink = document.getElementById('settingsLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileRestrictionMessage = document.getElementById('mobileRestrictionMessage');
    const wrapper = document.getElementById('wrapper'); // The main dashboard wrapper

    // Article related elements (initially null, will be queried when section is loaded)
    let addNewArticleBtn = null;
    let articleFormContainer = null;
    let articleForm = null;
    let articleTitleInput = null;
    let articleContentInput = null;
    let articleImageUrlInput = null;
    let articleCategoryInput = null;
    let articleFormStatusInput = null;
    let saveArticleBtn = null;
    let cancelArticleFormBtn = null;
    let articlesTableBody = null; // This will hold the tbody element
    let articleFormTitle = null;


    // Doctor's Note related elements (initially null, will be queried when section is loaded)
    let addNoteBtn = null;
    let noteFormContainer = null;
    let noteForm = null;
    let noteTitleInput = null;
    let noteDateInput = null;
    let noteContentInput = null;
    let noteFormStatusInput = null;
    let saveNoteBtn = null;
    let cancelNoteFormBtn = null;
    let notesTableBody = null; // This will hold the tbody element
    let noteFormTitle = null;

    // --- 2. GLOBAL VARIABLES ---
    let currentEditingArticleId = null;
    let currentEditingDoctorNoteId = null;

    // --- Initial Dummy Data (Doctor's Notes - NOT YET FIRESTORE ENABLED) ---
    // This will remain local until you decide to migrate Doctor's Notes to Firestore as well.
    let doctorNotesData = [
        {
            id: 101,
            title: 'Understanding Common Cold Symptoms',
            date: '2024-01-10',
            status: true, // true for Published, false for Draft
            content: 'The common cold is a viral infection of your nose and throat. Symptoms include runny nose, sore throat, cough, congestion, and sometimes body aches. It usually resolves within 7-10 days. Rest, fluids, and over-the-counter medications can help manage symptoms.'
        },
        {
            id: 102,
            title: 'Benefits of a Balanced Diet',
            date: '2024-02-15',
            status: false,
            content: 'A balanced diet provides your body with essential nutrients, promoting overall health and well-being. It can reduce the risk of chronic diseases, improve energy levels, and support a healthy immune system. Focus on whole foods, lean proteins, fruits, vegetables, and healthy fats.'
        },
        {
            id: 103,
            title: 'Importance of Regular Exercise',
            date: '2024-03-20',
            status: true,
            content: 'Regular physical activity is vital for a healthy lifestyle. It strengthens your heart and lungs, builds strong bones and muscles, reduces the risk of many diseases, and improves mood. Aim for at least 30 minutes of moderate-intensity exercise most days of the week.'
        },
        {
            id: 104,
            title: 'Managing Seasonal Allergies',
            date: '2024-04-05',
            status: true,
            content: 'Seasonal allergies can cause sneezing, itchy eyes, runny nose, and congestion. They are triggered by pollen from trees, grasses, and weeds. Antihistamines, nasal sprays, and avoiding allergens can help manage symptoms. Consult a doctor for severe cases.'
        }
    ];
    let nextDoctorNoteId = doctorNotesData.length > 0 ? Math.max(...doctorNotesData.map(n => n.id)) + 1 : 201;


    // --- 3. AUTHENTICATION AND INITIAL DISPLAY ---
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("User is logged in:", user.email);
            // Show the dashboard section after auth state is determined
            showDashboardSection('dashboard'); // Changed from 'dashboardContent' to 'dashboard' to match function logic
        } else {
            console.log("No user is logged in. Redirecting to login page.");
            // Ensure redirection only happens if not already on the login page
            if (window.location.pathname !== '/adminLogin.html' && window.location.pathname !== '/adminLogin.html/') {
                window.location.href = 'adminLogin.html';
            }
        }
    });

    // Logout button event listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link behavior if it's an <a> tag

            firebase.auth().signOut().then(() => {
                console.log("User signed out successfully.");
                showToast('Logged out successfully!', 'info'); 
                window.location.href = 'adminLogin.html';
            }).catch((error) => {
                console.error("Error signing out:", error);
                showToast('Error logging out. Please try again.', 'danger');
            });
        });
    } else {
        console.warn("WARNING: Logout Button (logoutBtn) not found.");
    }

    // --- 4. Mobile Restriction Check ---
    const MOBILE_BREAKPOINT = 768; // Bootstrap's 'md' breakpoint

    function checkMobileAccess() {
        if (window.innerWidth < MOBILE_BREAKPOINT) {
            mobileRestrictionMessage.style.display = 'flex'; // Show message
            if (wrapper) { wrapper.style.display = 'none'; } // Hide dashboard content
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            mobileRestrictionMessage.style.display = 'none'; // Hide message
            if (wrapper) { wrapper.style.display = 'flex'; } // Show dashboard content (or whatever its default display is)
            document.body.style.overflow = ''; // Allow scrolling
        }
    }

    // Run check on page load
    checkMobileAccess();

    // Run check whenever the window is resized
    window.addEventListener('resize', checkMobileAccess);

    // IMPORTANT: DO NOT `return;` here. Let the script continue to attach listeners
    // The UI will be hidden by `checkMobileAccess`, but core JS must run.


    // --- 5. Helper Function to Manage Active Sidebar Links ---
    function activateNavLink(linkElement) {
        // Remove 'active' from all sidebar links
        if (dashboardLink) dashboardLink.classList.remove('active');
        if (doctorNoteLink) doctorNoteLink.classList.remove('active');
        if (allArticlesLink) allArticlesLink.classList.remove('active');
        if (settingsLink) settingsLink.classList.remove('active');
        if (logoutBtn) logoutBtn.classList.remove('active'); 

        // Add 'active' to the clicked link
        if (linkElement) {
            linkElement.classList.add('active');
        }
    }

    // --- 6. LOADING INDICATOR FUNCTIONS ---
    function showLoading(buttonElement, loadingText = 'Loading...') {
        if (!buttonElement) return;
        buttonElement.dataset.originalText = buttonElement.innerHTML;
        buttonElement.disabled = true;
        buttonElement.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ${loadingText}
        `;
    }

    function hideLoading(buttonElement) {
        if (!buttonElement) return;
        buttonElement.innerHTML = buttonElement.dataset.originalText || buttonElement.textContent;
        buttonElement.disabled = false;
    }

    // --- 7. TOAST NOTIFICATION FUNCTION ---
    function showToast(message, type = 'success') {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            console.error('Toast container not found! Please ensure you have <div class="toast-container"> in your HTML.');
            alert(message); // Fallback to alert if container is missing
            return;
        }

        const toastId = `toast-${Date.now()}`;
        const toastHtml = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
            toast.show();
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
        }
    }

    // --- 8. FORM VALIDATION HELPERS ---
    function setValidationFeedback(element, isValid, message = '') {
        if (!element) return;
        if (isValid) {
            element.classList.remove('is-invalid');
            element.classList.add('is-valid');
            if (element.nextElementSibling && element.nextElementSibling.classList.contains('invalid-feedback')) {
                element.nextElementSibling.remove();
            }
        } else {
            element.classList.remove('is-valid');
            element.classList.add('is-invalid');
            if (!element.nextElementSibling || !element.nextElementSibling.classList.contains('invalid-feedback')) {
                const feedback = document.createElement('div');
                feedback.classList.add('invalid-feedback');
                element.parentNode.insertBefore(feedback, element.nextSibling);
            }
            element.nextElementSibling.textContent = message;
        }
    }

    function clearFormValidation(formElement) {
        if (!formElement) return;
        const invalidFields = formElement.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            field.classList.remove('is-invalid');
            if (field.nextElementSibling && field.nextElementSibling.classList.contains('invalid-feedback')) {
                field.nextElementSibling.remove();
            }
        });
        const validFields = formElement.querySelectorAll('.is-valid');
        validFields.forEach(field => {
            field.classList.remove('is-valid');
        });
    }

    // --- 9. DOCTOR'S NOTE FUNCTIONS (STILL USES LOCAL DATA) ---

    // Function to render the doctor's notes table from the doctorNotesData array
    function renderNotesTable(notesToRender = doctorNotesData) {
        if (!notesTableBody) {
            console.error("notesTableBody not found for rendering notes.");
            return;
        }
        let tableRowsHtml = '';
        if (notesToRender.length === 0) {
            tableRowsHtml = '<tr><td colspan="5" class="text-center py-4">No doctor\'s notes found.</td></tr>';
        } else {
            notesToRender.forEach(note => {
                tableRowsHtml += `
                    <tr>
                        <td>${note.title}</td>
                        <td>${note.date}</td>
                        <td>
                            <div class="form-check form-switch">
                                <input class="form-check-input note-status-toggle" type="checkbox" role="switch"
                                       id="noteStatus${note.id}" ${note.status ? 'checked' : ''} data-note-id="${note.id}">
                                <label class="form-check-label" for="noteStatus${note.id}">${note.status ? 'Published' : 'Draft'}</label>
                            </div>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-info view-note-btn" data-note-id="${note.id}"><i class="fas fa-eye"></i></button>
                            <button class="btn btn-sm btn-warning edit-note-btn" data-note-id="${note.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger delete-note-btn" data-note-id="${note.id}"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        }
        // Assuming notesTableBody is the <tbody> element within the table
        notesTableBody.innerHTML = tableRowsHtml;

        // Attach event listeners for dynamically created note buttons
        setupNoteActionButtons();
    }

    // Helper to attach event listeners for note action buttons
    function setupNoteActionButtons() {
        const viewButtons = document.querySelectorAll('.view-note-btn');
        viewButtons.forEach(button => {
            button.removeEventListener('click', handleViewNote);
            button.addEventListener('click', handleViewNote);
        });

        const editButtons = document.querySelectorAll('.edit-note-btn');
        editButtons.forEach(button => {
            button.removeEventListener('click', handleEditNote);
            button.addEventListener('click', handleEditNote);
        });

        const deleteButtons = document.querySelectorAll('.delete-note-btn');
        deleteButtons.forEach(button => {
            button.removeEventListener('click', handleDeleteNote);
            button.addEventListener('click', handleDeleteNote);
        });

        const statusToggles = document.querySelectorAll('.note-status-toggle');
        statusToggles.forEach(toggle => {
            toggle.removeEventListener('change', handleNoteStatusToggle);
            toggle.addEventListener('change', handleNoteStatusToggle);
        });
    }

    // Handlers for Doctor's Notes (local data)
    function handleViewNote(event) {
        const noteId = parseInt(event.target.dataset.noteId);
        const note = doctorNotesData.find(n => n.id === noteId);
        if (note) {
            alert(`Title: ${note.title}\nDate: ${note.date}\nStatus: ${note.status ? 'Published' : 'Draft'}\nContent: ${note.content}`);
        }
    }

    function handleEditNote(event) {
        currentEditingDoctorNoteId = parseInt(event.target.dataset.noteId);
        const note = doctorNotesData.find(n => n.id === currentEditingDoctorNoteId);
        if (note) {
            if (noteFormTitle) noteFormTitle.textContent = 'Edit Doctor\'s Note';
            if (noteTitleInput) noteTitleInput.value = note.title;
            if (noteDateInput) noteDateInput.value = note.date;
            if (noteContentInput) noteContentInput.value = note.content;
            if (noteFormStatusInput) noteFormStatusInput.checked = note.status;

            if (noteFormContainer) noteFormContainer.style.display = 'block';
            if (notesListTable) notesListTable.style.display = 'none';
            clearFormValidation(noteForm);
        }
    }

    function handleDeleteNote(event) {
        const noteId = parseInt(event.target.dataset.noteId);
        if (confirm('Are you sure you want to delete this doctor\'s note?')) {
            doctorNotesData = doctorNotesData.filter(note => note.id !== noteId);
            renderNotesTable();
            showToast('Note deleted successfully!', 'success');
        }
    }

    function handleNoteStatusToggle(event) {
        const noteId = parseInt(event.target.dataset.noteId);
        const note = doctorNotesData.find(n => n.id === noteId);
        if (note) {
            note.status = event.target.checked;
            showToast(`Note "${note.title}" status changed to ${note.status ? 'Published' : 'Draft'}.`, 'info');
            // Re-render to update the label if needed, or just change the label text directly
            event.target.nextElementSibling.textContent = note.status ? 'Published' : 'Draft';
        }
    }

    // Listener setup for Doctor's Notes section (called after HTML injection)
    function setupDoctorNoteListeners() {
        addNoteBtn = document.getElementById('addNoteBtn');
        noteFormContainer = document.getElementById('noteFormContainer');
        noteForm = document.getElementById('noteForm');
        noteTitleInput = document.getElementById('noteTitle');
        noteDateInput = document.getElementById('noteDate');
        noteContentInput = document.getElementById('noteContent');
        noteFormStatusInput = document.getElementById('noteFormStatus');
        saveNoteBtn = document.getElementById('saveNoteBtn');
        cancelNoteFormBtn = document.getElementById('cancelNoteFormBtn');
        notesTableBody = document.querySelector('#noteListTable tbody'); // Ensure this points to the tbody
        noteFormTitle = document.getElementById('noteFormTitle');
        const notesListTable = document.getElementById('noteListTable'); // Get the parent div for table

        // Add New Note Button
        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', () => {
                if (noteFormContainer) noteFormContainer.style.display = 'block';
                if (notesListTable) notesListTable.style.display = 'none'; // Hide the table when form is shown
                if (noteForm) noteForm.reset(); // Clear form fields
                if (noteFormTitle) noteFormTitle.textContent = 'Add New Doctor\'s Note';
                currentEditingDoctorNoteId = null;
                clearFormValidation(noteForm);
            });
        }

        // Cancel Note Form Button
        if (cancelNoteFormBtn) {
            cancelNoteFormBtn.addEventListener('click', () => {
                if (noteFormContainer) noteFormContainer.style.display = 'none';
                if (notesListTable) notesListTable.style.display = 'block'; // Show the table again
                if (noteForm) noteForm.reset();
                clearFormValidation(noteForm);
            });
        }

        // Note Form Submission
        if (noteForm) {
            noteForm.addEventListener('submit', function(event) {
                event.preventDefault();
                clearFormValidation(noteForm);

                let isValid = true;
                if (!noteTitleInput.value.trim()) {
                    setValidationFeedback(noteTitleInput, false, 'Note title is required.');
                    isValid = false;
                }
                if (!noteDateInput.value.trim()) {
                    setValidationFeedback(noteDateInput, false, 'Date is required.');
                    isValid = false;
                }
                if (!noteContentInput.value.trim()) {
                    setValidationFeedback(noteContentInput, false, 'Content is required.');
                    isValid = false;
                }

                if (!isValid) {
                    showToast('Please correct the highlighted fields.', 'warning');
                    return;
                }

                const newNote = {
                    title: noteTitleInput.value.trim(),
                    date: noteDateInput.value.trim(),
                    content: noteContentInput.value.trim(),
                    status: noteFormStatusInput.checked // true for Published, false for Draft
                };

                showLoading(saveNoteBtn, 'Saving...');

                setTimeout(() => { // Simulate async save for local data
                    if (currentEditingDoctorNoteId) {
                        // Update existing note
                        const index = doctorNotesData.findIndex(n => n.id === currentEditingDoctorNoteId);
                        if (index !== -1) {
                            doctorNotesData[index] = { ...doctorNotesData[index], ...newNote };
                            showToast('Note updated successfully!', 'success');
                        } else {
                            showToast('Error: Note not found for update.', 'danger');
                        }
                    } else {
                        // Add new note
                        newNote.id = nextDoctorNoteId++;
                        doctorNotesData.push(newNote);
                        showToast('Note added successfully!', 'success');
                    }

                    hideLoading(saveNoteBtn);
                    renderNotesTable(); // Re-render table
                    noteForm.reset();
                    clearFormValidation(noteForm);
                    if (noteFormContainer) noteFormContainer.style.display = 'none';
                    if (notesListTable) notesListTable.style.display = 'block';
                }, 500); // Simulate network delay
            });
        }

        renderNotesTable(); // Initial render of notes table after listeners are set up
    }


    // --- 10. ARTICLE FUNCTIONS (FIRESTORE ENABLED) ---

    // Function to render Articles Table (listens to Firestore in real-time)
    function renderArticlesTable() {
        // Ensure articlesTableBody is available (it will be queried by setupArticleListeners)
        if (!articlesTableBody) {
            console.error("articlesTableBody not found for rendering articles. Make sure setupArticleListeners has run.");
            return;
        }

        // Clear existing table content before populating
        articlesTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Loading articles...</td></tr>';

        // Listen for real-time updates from Firestore
        db.collection("articles").orderBy("createdAt", "desc") // Order by creation time
            .onSnapshot((snapshot) => {
                articlesTableBody.innerHTML = ''; // Clear existing
                if (snapshot.empty) {
                    articlesTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No articles available. Click "Add New Article" to add one.</td></tr>';
                    return;
                }

                snapshot.forEach(doc => {
                    const article = doc.data();
                    const articleId = doc.id; // Get the Firestore document ID

                    const row = articlesTableBody.insertRow();
                    row.innerHTML = `
                        <td>${article.title}</td>
                        <td>${article.category}</td>
                        <td>${article.status}</td>
                        <td>${new Date(article.createdAt ? article.createdAt.toDate() : '').toLocaleDateString()}</td> 
                        <td>
                            <button class="btn btn-info btn-sm me-1 edit-article-btn" data-id="${articleId}">Edit</button>
                            <button class="btn btn-danger btn-sm delete-article-btn" data-id="${articleId}">Delete</button>
                        </td>
                    `;
                });

                // Attach event listeners for edit and delete buttons after rendering
                setupArticleActionButtons();
            }, (error) => {
                console.error("Error getting articles: ", error);
                articlesTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading articles.</td></tr>';
                showToast('Error loading articles.', 'danger');
            });
    }

    // Helper to attach event listeners to dynamically created article buttons
    function setupArticleActionButtons() {
        const editButtons = document.querySelectorAll('.edit-article-btn');
        editButtons.forEach(button => {
            button.removeEventListener('click', handleEditArticle); // Prevent duplicate listeners
            button.addEventListener('click', handleEditArticle);
        });

        const deleteButtons = document.querySelectorAll('.delete-article-btn');
        deleteButtons.forEach(button => {
            button.removeEventListener('click', handleDeleteArticle); // Prevent duplicate listeners
            button.addEventListener('click', handleDeleteArticle);
        });
    }

    // Handlers for Article Edit/Delete (will be called from setupArticleActionButtons)
    function handleEditArticle(event) {
        const articleId = event.target.dataset.id;
        // Fetch article data from Firestore to populate the form
        db.collection("articles").doc(articleId).get()
            .then(doc => {
                if (doc.exists) {
                    const article = doc.data();
                    currentEditingArticleId = doc.id; // Store ID for update

                    // Populate form fields
                    if (articleTitleInput) articleTitleInput.value = article.title;
                    if (articleContentInput) articleContentInput.value = article.content;
                    if (articleImageUrlInput) articleImageUrlInput.value = article.imageUrl;
                    if (articleCategoryInput) articleCategoryInput.value = article.category;
                    if (articleFormStatusInput) articleFormStatusInput.checked = (article.status === 'published'); 

                    if (articleFormTitle) {
                        articleFormTitle.textContent = 'Edit Article';
                    }

                    // Show the form and hide the table
                    if (articleFormContainer) articleFormContainer.style.display = 'block';
                    const articleListTable = document.getElementById('articleListTable'); // Get the parent div for table
                    if (articleListTable) articleListTable.style.display = 'none';
                    clearFormValidation(articleForm);
                } else {
                    showToast('Article not found for editing.', 'warning');
                    console.error("No such document!");
                }
            })
            .catch(error => {
                showToast('Error fetching article for edit.', 'danger');
                console.error("Error getting document:", error);
            });
    }

    function handleDeleteArticle(event) {
        const articleId = event.target.dataset.id;
        if (confirm('Are you sure you want to delete this article?')) {
            db.collection("articles").doc(articleId).delete()
                .then(() => {
                    showToast('Article deleted successfully!', 'success');
                    console.log("Document successfully deleted!");
                    // Firestore onSnapshot will automatically re-render the table
                })
                .catch(error => {
                    showToast('Error deleting article.', 'danger');
                    console.error("Error removing document: ", error);
                });
        }
    }

    // Listener setup for Article Management section (called after HTML injection)
    function setupArticleListeners() {
        addNewArticleBtn = document.getElementById('addNewArticleBtn');
        articleFormContainer = document.getElementById('articleFormContainer');
        articleForm = document.getElementById('articleForm');
        articleTitleInput = document.getElementById('articleTitle');
        articleContentInput = document.getElementById('articleContent');
        articleImageUrlInput = document.getElementById('articleImageURL');
        articleCategoryInput = document.getElementById('articleCategory');
        articleFormStatusInput = document.getElementById('articleFormStatus');
        saveArticleBtn = document.getElementById('saveArticleBtn');
        cancelArticleFormBtn = document.getElementById('cancelArticleFormBtn');
        articlesTableBody = document.querySelector('#articleListTable tbody'); // Select the tbody inside articleListTable
        articleFormTitle = document.getElementById('articleFormTitle');
        const articleListTable = document.getElementById('articleListTable'); // Get the parent div for table


        // Add New Article Button
        if (addNewArticleBtn) {
            addNewArticleBtn.addEventListener('click', () => {
                if (articleFormContainer) articleFormContainer.style.display = 'block';
                if (articleListTable) articleListTable.style.display = 'none'; // Hide the table when form is shown
                if (articleForm) articleForm.reset(); // Clear form fields
                if (articleFormTitle) articleFormTitle.textContent = 'Add New Article';
                currentEditingArticleId = null; // Reset current editing ID
                clearFormValidation(articleForm);
            });
        }

        // Cancel Article Form Button
        if (cancelArticleFormBtn) {
            cancelArticleFormBtn.addEventListener('click', () => {
                if (articleFormContainer) articleFormContainer.style.display = 'none';
                if (articleListTable) articleListTable.style.display = 'block'; // Show the table again
                if (articleForm) articleForm.reset();
                clearFormValidation(articleForm);
            });
        }

        // Article form submission (CREATE/UPDATE)
        if (articleForm) {
            articleForm.addEventListener('submit', function(event) {
                event.preventDefault();
                clearFormValidation(articleForm);

                let isValid = true;
                if (!articleTitleInput.value.trim()) {
                    setValidationFeedback(articleTitleInput, false, 'Article title is required.');
                    isValid = false;
                }
                if (!articleContentInput.value.trim()) {
                    setValidationFeedback(articleContentInput, false, 'Article content is required.');
                    isValid = false;
                }
                if (!articleImageUrlInput.value.trim()) {
                    setValidationFeedback(articleImageUrlInput, false, 'Image URL is required.');
                    isValid = false;
                } else if (!/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(articleImageUrlInput.value.trim())) {
                    setValidationFeedback(articleImageUrlInput, false, 'Please enter a valid URL.');
                    isValid = false;
                }
                if (!articleCategoryInput.value.trim()) {
                    setValidationFeedback(articleCategoryInput, false, 'Category is required.');
                    isValid = false;
                }

                if (!isValid) {
                    showToast('Please correct the highlighted fields.', 'warning');
                    return;
                }

                const articleData = {
                    title: articleTitleInput.value.trim(),
                    content: articleContentInput.value.trim(),
                    imageUrl: articleImageUrlInput.value.trim(),
                    category: articleCategoryInput.value.trim(),
                    status: articleFormStatusInput ? (articleFormStatusInput.checked ? 'published' : 'draft') : 'draft',
                };

                showLoading(saveArticleBtn, 'Saving...');

                if (currentEditingArticleId) {
                    // Update existing article in Firestore
                    db.collection("articles").doc(currentEditingArticleId).update(articleData)
                        .then(() => {
                            showToast('Article updated successfully!', 'success');
                            console.log("Document successfully updated!");
                            currentEditingArticleId = null; // Reset edit ID
                        })
                        .catch((error) => {
                            showToast('Error updating article.', 'danger');
                            console.error("Error updating document: ", error);
                        })
                        .finally(() => {
                            hideLoading(saveArticleBtn);
                            articleForm.reset();
                            clearFormValidation(articleForm);
                            if (articleFormContainer) articleFormContainer.style.display = 'none';
                            if (articleListTable) articleListTable.style.display = 'block';
                            if (articleFormTitle) {
                                articleFormTitle.textContent = 'Add New Article'; // Reset form title
                            }
                        });
                } else {
                    // Add new article to Firestore
                    const newArticleData = {
                        ...articleData,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp() // Add timestamp for new articles
                    };

                    db.collection("articles").add(newArticleData)
                        .then((docRef) => {
                            showToast('Article added successfully!', 'success');
                            console.log("Document written with ID: ", docRef.id);
                        })
                        .catch((error) => {
                            showToast('Error adding article.', 'danger');
                            console.error("Error adding document: ", error);
                        })
                        .finally(() => {
                            hideLoading(saveArticleBtn);
                            articleForm.reset();
                            clearFormValidation(articleForm);
                            if (articleFormContainer) articleFormContainer.style.display = 'none';
                            if (articleListTable) articleListTable.style.display = 'block';
                        });
                }
            });
        }
        renderArticlesTable(); // Initial render of articles table after listeners are set up
    }


    // --- 11. MAIN CONTENT RENDERING FUNCTION ---
    let currentAdminContentSection = 'dashboard'; // Keep track of current section

    function showDashboardSection(sectionId) {
        // Hide all dashboard sections first
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // Determine which section to show and inject its HTML
        let sectionHtml = '';
        if (sectionId === 'dashboard') {
            sectionHtml = `
                <div class="row g-4 dashboard-grid-custom">
                    <div class="col-12 col-lg-6">
                        <div class="card shadow-sm p-4">
                            <h3 class="card-title text-primary">Recent Doctor's Note</h3>
                            <ul class="list-unstyled" id="recentDoctorNotesList">
                                <li><i class="fas fa-check-square text-success me-2"></i> Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li>
                                <li><i class="fas fa-check-square text-success me-2"></i> Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li>
                                <li><i class="fas fa-check-square text-success me-2"></i> Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li>
                            </ul>
                            <button class="btn btn-primary mt-3 d-block mx-auto view-all-notes-btn">View All</button>
                        </div>
                    </div>
                    <div class="col-12 col-lg-6">
                        <div class="card shadow-sm p-4">
                            <h3 class="card-title text-primary">Latest Updates</h3>
                            <ul class="list-unstyled" id="latestUpdatesList">
                                <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
                                <li>Sed do eiusmod tempor incididunt ut labore et dolore.</li>
                                <li>Magna aliqua. Ut enim ad minim veniam, quis nostrud.</li>
                                <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
                            </ul>
                            <button class="btn btn-primary mt-3 d-block mx-auto">View All</button>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="card shadow-sm p-4">
                            <h3 class="card-title text-primary">All Articles</h3>
                            <ul class="list-unstyled article-list-dashboard" id="latestArticlesDashboardList">
                                <li class="d-flex align-items-center py-2 border-bottom">
                                    <img src="https://via.placeholder.com/60" alt="Article Thumbnail" class="rounded me-3">
                                    <span>Stress Management Techniques</span>
                                </li>
                                <li class="d-flex align-items-center py-2 border-bottom">
                                    <img src="https://via.placeholder.com/60" alt="Article Thumbnail" class="rounded me-3">
                                    <span>Healthy eating habits</span>
                                </li>
                                <li class="d-flex align-items-center py-2">
                                    <img src="https://via.placeholder.com/60" alt="Article Thumbnail" class="rounded me-3">
                                    <span>Workplace safety measures</span>
                                </li>
                            </ul>
                            <button class="btn btn-primary mt-3 d-block mx-auto view-all-articles-btn">View All</button>
                        </div>
                    </div>
                </div>
            `;
        } else if (sectionId === 'doctorNote') {
            sectionHtml = `
                <div class="doctor-note-section">
                    <h2 class="section-title">Doctor's Note Management</h2>
                    <button class="btn btn-primary add-note-btn" id="addNoteBtn"><i class="fas fa-plus"></i> Add New Note</button> 
                    <div class="table-responsive" id="noteListTable">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                </tbody>
                        </table>
                    </div>
                    <div class="note-form-container" id="noteFormContainer" style="display: none; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.08); margin-top: 30px;">
                        <h3 id="noteFormTitle">Add New Doctor's Note</h3>
                        <form id="noteForm">
                            <div class="mb-3">
                                <label for="noteTitle" class="form-label">Note Title</label>
                                <input type="text" class="form-control" id="noteTitle" required>
                            </div>
                            <div class="mb-3">
                                <label for="noteDate" class="form-label">Date</label>
                                <input type="date" class="form-control" id="noteDate" required>
                            </div>
                            <div class="mb-3">
                                <label for="noteContent" class="form-label">Content</label>
                                <textarea class="form-control" id="noteContent" rows="6" required></textarea>
                            </div>
                            <div class="mb-3 form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="noteFormStatus" checked>
                                <label class="form-check-label" for="noteFormStatus">Active</label>
                            </div>
                            <button type="submit" class="btn btn-success" id="saveNoteBtn">Save Note</button>
                            <button type="button" class="btn btn-secondary" id="cancelNoteFormBtn">Cancel</button>
                        </form>
                    </div>
                </div>
            `;
        } else if (sectionId === 'manageArticles') {
            sectionHtml = `
                <div class="manage-articles-section">
                    <h2 class="section-title">All Articles</h2>
                    <div class="article-actions">
                        <button class="btn btn-primary add-article-btn" id="addNewArticleBtn"><i class="fas fa-plus"></i> Add New Article</button>
                        <div class="search-filter-controls">
                            <input type="text" placeholder="Search articles..." class="form-control search-input">
                            <select class="form-select filter-select">
                                <option value="">All Categories</option>
                                <option value="Sleep and Rest">Sleep and Rest</option>
                                <option value="Mental Health">Mental Health</option>
                                <option value="Diet and Nutrition">Diet and Nutrition</option>
                                <option value="Physical Activity">Physical Activity</option>
                            </select>
                        </div>
                    </div>

                    <div class="table-responsive" id="articleListTable">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                </tbody>
                        </table>
                    </div>

                    <div class="article-form-container" id="articleFormContainer" style="display: none;">
                        <h3 id="articleFormTitle">Add New Article</h3>
                        <form id="articleForm">
                            <div class="mb-3">
                                <label for="articleTitle" class="form-label">Title</label>
                                <input type="text" class="form-control" id="articleTitle" required>
                            </div>
                            <div class="mb-3">
                                <label for="articleCategory" class="form-label">Category</label>
                                <select class="form-select" id="articleCategory" required>
                                    <option value="">Select Category</option>
                                    <option value="Sleep and Rest">Sleep and Rest</option>
                                    <option value="Mental Health">Mental Health</option>
                                    <option value="Diet and Nutrition">Diet and Nutrition</option>
                                    <option value="Physical Activity">Physical Activity</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="articleImageURL" class="form-label">Image URL</label>
                                <input type="url" class="form-control" id="articleImageURL" placeholder="e.g., https://example.com/image.jpg">
                            </div>
                            <div class="mb-3">
                                <label for="articleContent" class="form-label">Content</label>
                                <textarea class="form-control" id="articleContent" rows="8" required></textarea>
                            </div>
                            <div class="mb-3 form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="articleFormStatus">
                                <label class="form-check-label" for="articleFormStatus">Published</label>
                            </div>
                            <button type="submit" class="btn btn-success" id="saveArticleBtn">Save Article</button>
                            <button type="button" class="btn btn-secondary" id="cancelArticleFormBtn">Cancel</button>
                        </form>
                    </div>
                </div>
            `;
        } else if (sectionId === 'settings') {
            sectionHtml = `
                <div class="settings-section">
                    <h2 class="section-title">Settings</h2>
                    <div class="settings-tabs">
                        <ul class="nav nav-tabs" id="settingsTab" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="true">Profile Settings</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="security-tab" data-bs-toggle="tab" data-bs-target="#security" type="button" role="tab" aria-controls="security" aria-selected="false">Security</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="notifications-tab" data-bs-toggle="tab" data-bs-target="#notifications" type="button" role="tab" aria-controls="notifications" aria-selected="false">Notifications</button>
                            </li>
                        </ul>
                        <div class="tab-content" id="settingsTabContent">
                            <div class="tab-pane fade show active" id="profile" role="tabpanel" aria-labelledby="profile-tab">
                                <h4>Edit Profile</h4>
                                <form>
                                    <div class="mb-3">
                                        <label for="adminName" class="form-label">Name</label>
                                        <input type="text" class="form-control" id="adminName" value="Dr. XYZ">
                                    </div>
                                    <div class="mb-3">
                                        <label for="adminEmail" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="adminEmail" value="admin@example.com" readonly>
                                    </div>
                                    <button type="submit" class="btn btn-success">Save Profile</button>
                                </form>
                            </div>
                            <div class="tab-pane fade" id="security" role="tabpanel" aria-labelledby="security-tab">
                                <h4>Change Password</h4>
                                <form>
                                    <div class="mb-3">
                                        <label for="currentPassword" class="form-label">Current Password</label>
                                        <input type="password" class="form-control" id="currentPassword">
                                    </div>
                                    <div class="mb-3">
                                        <label for="newPassword" class="form-label">New Password</label>
                                        <input type="password" class="form-control" id="newPassword">
                                    </div>
                                    <div class="mb-3">
                                        <label for="confirmNewPassword" class="form-label">Confirm New Password</label>
                                        <input type="password" class="form-control" id="confirmNewPassword">
                                    </div>
                                    <button type="submit" class="btn btn-success">Change Password</button>
                                </form>
                            </div>
                            <div class="tab-pane fade" id="notifications" role="tabpanel" aria-labelledby="notifications-tab">
                                <h4>Notification Preferences</h4>
                                <div class="form-check form-switch mb-3">
                                    <input class="form-check-input" type="checkbox" role="switch" id="emailNotifications" checked>
                                    <label class="form-check-label" for="emailNotifications">Enable Email Notifications</label>
                                </div>
                                <div class="form-check form-switch mb-3">
                                    <input class="form-check-input" type="checkbox" role="switch" id="smsNotifications">
                                    <label class="form-check-label" for="smsNotifications">Enable SMS Notifications</label>
                                </div>
                                <button type="submit" class="btn btn-success">Save Preferences</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            console.error(`Section with ID "${sectionId}" not found.`);
            return; // Exit if section is invalid
        }

        // Inject the HTML into the main content div
        if (dashboardContentDiv) {
            dashboardContentDiv.innerHTML = sectionHtml;
            currentAdminContentSection = sectionId; // Update tracking variable
        } else {
            console.error("Dashboard content div not found.");
            return;
        }

        // After injecting HTML, set up listeners for the *newly loaded* elements
        if (sectionId === 'dashboard') {
            dashboardContentDiv.querySelector('.view-all-notes-btn').addEventListener('click', () => {
                activateNavLink(doctorNoteLink);
                showDashboardSection('doctorNote');
            });
            dashboardContentDiv.querySelector('.view-all-articles-btn').addEventListener('click', () => {
                activateNavLink(allArticlesLink);
                showDashboardSection('manageArticles');
            });
        } else if (sectionId === 'doctorNote') {
            setupDoctorNoteListeners();
        } else if (sectionId === 'manageArticles') {
            setupArticleListeners();
        } else if (sectionId === 'settings') {
            // Initialize Bootstrap tabs after content is loaded
            const settingsTabElement = document.getElementById('settingsTab');
            if (settingsTabElement) {
                new bootstrap.Tab(settingsTabElement.querySelector('.nav-link.active')).show();
            }
        }
        
        // Activate the corresponding navigation link
        const navLinkToActivate = {
            'dashboard': dashboardLink,
            'doctorNote': doctorNoteLink,
            'manageArticles': allArticlesLink,
            'settings': settingsLink
        }[sectionId];
        activateNavLink(navLinkToActivate);
    }

    // --- 12. INITIAL EVENT LISTENERS (for sidebar navigation) ---
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (event) => {
            event.preventDefault();
            showDashboardSection('dashboard');
        });
    }
    if (doctorNoteLink) {
        doctorNoteLink.addEventListener('click', (event) => {
            event.preventDefault();
            showDashboardSection('doctorNote');
        });
    }
    if (allArticlesLink) {
        allArticlesLink.addEventListener('click', (event) => {
            event.preventDefault();
            showDashboardSection('manageArticles');
        });
    }
    if (settingsLink) {
        settingsLink.addEventListener('click', (event) => {
            event.preventDefault();
            showDashboardSection('settings');
        });
    }
}); // End DOMContentLoaded