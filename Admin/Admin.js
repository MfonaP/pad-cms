
document.addEventListener('DOMContentLoaded', function() {

    // --- 1. DOM Element Declarations  ---
    
    const dashboardContentDiv = document.getElementById('dashboardContent');
    const dashboardLink = document.getElementById('dashboardLink');
    const doctorNoteLink = document.getElementById('doctorNoteLink');
    const allArticlesLink = document.getElementById('allArticlesLink');
    const settingsLink = document.getElementById('settingsLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileRestrictionMessage = document.getElementById('mobileRestrictionMessage');
    const wrapper = document.getElementById('wrapper'); // The main dashboard wrapper
    const viewAllNotesBtn = dashboardContentDiv.querySelector('.view-all-notes-btn');
    const viewAllArticlesBtn = dashboardContentDiv.querySelector('.view-all-articles-btn');
            

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
    let articlesTableBody = null; 
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
    let notesTableBody = null; 
    let noteFormTitle = null;

    // --- 2. GLOBAL VARIABLES ---
    let currentEditingArticleId = null;
    let currentEditingDoctorNoteId = null;

    

    // --- 3. AUTHENTICATION AND INITIAL DISPLAY ---
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("User is logged in:", user.email);
            
            showDashboardSection('dashboard'); 
        } else {
            console.log("No user is logged in. Redirecting to login page.");
            
            if (window.location.pathname !== '/adminLogin.html' && window.location.pathname !== '/adminLogin.html/') {
                window.location.href = 'adminLogin.html';
            }
        }
    });

    // Logout button event listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(event) {
            event.preventDefault(); 

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
    const MOBILE_BREAKPOINT = 768; 
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

// Helper function for form validation feedback (ensures consistency)
function setValidationFeedback(input, isValid, message) {
    const feedback = input.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.remove();
    }
    input.classList.remove('is-invalid', 'is-valid');
    if (!isValid) {
        input.classList.add('is-invalid');
        const newFeedback = document.createElement('div');
        newFeedback.className = 'invalid-feedback';
        newFeedback.textContent = message;
        input.parentNode.appendChild(newFeedback);
    } else {
        input.classList.add('is-valid');
    }
}

// Helper function to validate entire form
function validateForm(form) {
    clearFormValidation(form);
    let isValid = true;
    const requiredInputs = form.querySelectorAll('[required]');

    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            setValidationFeedback(input, false, 'This field is required.');
        } else {
            setValidationFeedback(input, true);
        }
    });
    return isValid;
}


// Function to render doctor notes table from Firestore data
function renderDoctorNotesTable() {
    const tableBody = noteListTable ? noteListTable.querySelector('tbody') : null;

    if (!tableBody) {
        console.error("Doctor note table body not found for rendering.");
        return;
    }

    // Initial loading message
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading notes...</td></tr>';

    // Setup the real-time listener for doctorNotes collection
    db.collection("doctorNotes").orderBy("createdAt", "desc").onSnapshot(snapshot => {
        console.log("Firestore onSnapshot: Doctor notes data changed!"); // Debug log
        tableBody.innerHTML = ''; // Clear existing rows

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No doctor notes found.</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const note = doc.data();
            const row = tableBody.insertRow();
            row.setAttribute('data-id', doc.id); // Store Firestore document ID
            row.innerHTML = `
                <td>${note.title}</td>
                <td>${note.date ? new Date(note.date).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <div class="form-check form-switch">
                        <input class="form-check-input note-status-toggle" type="checkbox" role="switch"
                               id="noteStatus${doc.id}" ${note.status ? 'checked' : ''} data-note-id="${doc.id}">
                        <label class="form-check-label" for="noteStatus${doc.id}">${note.status ? 'Published' : 'Draft'}</label>
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm btn-info view-note-btn" data-note-id="${doc.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-warning edit-note-btn" data-note-id="${doc.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-note-btn" data-note-id="${doc.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });

        // Re-attach event listeners for action buttons after rendering
        attachDoctorNoteActionListeners();

    }, error => {
        console.error("Error fetching doctor notes: ", error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">Error loading notes.</td></tr>';
        showToast('Error loading doctor notes.', 'danger');
    });
}

// Function to attach event listeners for dynamically created note buttons (Firestore-aware)
function attachDoctorNoteActionListeners() {
    document.querySelectorAll('.view-note-btn').forEach(button => {
        button.removeEventListener('click', handleViewNoteFirestore); // Prevent duplicate listeners
        button.addEventListener('click', handleViewNoteFirestore);
    });

    document.querySelectorAll('.edit-note-btn').forEach(button => {
        button.removeEventListener('click', handleEditNoteFirestore);
        button.addEventListener('click', handleEditNoteFirestore);
    });

    document.querySelectorAll('.delete-note-btn').forEach(button => {
        button.removeEventListener('click', handleDeleteNoteFirestore);
        button.addEventListener('click', handleDeleteNoteFirestore);
    });

    document.querySelectorAll('.note-status-toggle').forEach(toggle => {
        toggle.removeEventListener('change', handleNoteStatusToggleFirestore);
        toggle.addEventListener('change', handleNoteStatusToggleFirestore);
    });
}

// Handlers for Doctor's Notes (now using Firestore)
async function handleViewNoteFirestore(event) {
    const noteId = event.currentTarget.dataset.noteId;
    try {
        const doc = await db.collection("doctorNotes").doc(noteId).get();
        if (doc.exists) {
            const note = doc.data();
            alert(`Title: ${note.title}\nDate: ${note.date}\nStatus: ${note.status ? 'Published' : 'Draft'}\nContent: ${note.content}`);
        } else {
            showToast('Note not found.', 'danger');
        }
    } catch (error) {
        console.error("Error viewing note:", error);
        showToast('Error viewing note.', 'danger');
    }
}

async function handleEditNoteFirestore(event) {
    const noteId = event.currentTarget.dataset.noteId;
    currentEditingDoctorNoteId = noteId; // Store Firestore document ID

    try {
        const doc = await db.collection("doctorNotes").doc(noteId).get();
        if (doc.exists) {
            const note = doc.data();
            if (noteFormTitle) noteFormTitle.textContent = 'Edit Doctor\'s Note';
            if (noteTitleInput) noteTitleInput.value = note.title;
            if (noteDateInput) noteDateInput.value = note.date;
            if (noteContentInput) noteContentInput.value = note.content;
            if (noteFormStatusInput) noteFormStatusInput.checked = note.status;

            if (noteFormContainer) noteFormContainer.style.display = 'block';
            if (noteListTable) noteListTable.style.display = 'none'; // Hide the table div
            clearFormValidation(noteForm);
        } else {
            showToast('Note not found for editing.', 'danger');
        }
    } catch (error) {
        console.error("Error loading note for editing:", error);
        showToast('Error loading note for editing.', 'danger');
    }
}

async function handleDeleteNoteFirestore(event) {
    const noteId = event.currentTarget.dataset.noteId;
    if (confirm('Are you sure you want to delete this doctor\'s note?')) {
        showLoading(event.currentTarget, '<i class="fas fa-trash"></i> Deleting...');
        try {
            await db.collection("doctorNotes").doc(noteId).delete();
            showToast('Doctor note deleted successfully!', 'success');
            console.log("Doctor note successfully deleted!");
        } catch (error) {
            showToast('Error deleting doctor note.', 'danger');
            console.error("Error removing document: ", error);
        } finally {
            hideLoading(event.currentTarget, '<i class="fas fa-trash"></i> Delete');
        }
    }
}

async function handleNoteStatusToggleFirestore(event) {
    const noteId = event.currentTarget.dataset.noteId;
    const newStatus = event.currentTarget.checked;
    try {
        await db.collection("doctorNotes").doc(noteId).update({
            status: newStatus,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp() // Always update lastUpdated
        });
        showToast(`Note status updated to ${newStatus ? 'Published' : 'Draft'}.`, 'info');
    } catch (error) {
        console.error("Error updating note status:", error);
        showToast('Error updating note status.', 'danger');
    }
}


// This is the main function that gets called when the 'Doctor Note' section is displayed.
function setupDoctorNoteListeners() {
    // Get references to DOM elements *after* the HTML for the section is injected
   
    addNoteBtn = document.getElementById('addNoteBtn');
    noteFormContainer = document.getElementById('noteFormContainer');
    noteForm = document.getElementById('noteForm');
    noteTitleInput = document.getElementById('noteTitle');
    noteDateInput = document.getElementById('noteDate');
    noteContentInput = document.getElementById('noteContent');
    noteFormStatusInput = document.getElementById('noteFormStatus');
    saveNoteBtn = document.getElementById('saveNoteBtn');
    cancelNoteFormBtn = document.getElementById('cancelNoteFormBtn');
    noteListTable = document.getElementById('noteListTable'); // This is the div holding the table
    noteFormTitle = document.getElementById('noteFormTitle');


    // Add New Note Button handler
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            if (noteFormContainer) noteFormContainer.style.display = 'block';
            if (noteListTable) noteListTable.style.display = 'none'; 
            if (noteForm) noteForm.reset(); 
            if (noteFormTitle) noteFormTitle.textContent = 'Add New Doctor\'s Note';
            currentEditingDoctorNoteId = null; 
            clearFormValidation(noteForm);
        });
    }

    // Cancel Note Form Button handler
    if (cancelNoteFormBtn) {
        cancelNoteFormBtn.addEventListener('click', () => {
            if (noteFormContainer) noteFormContainer.style.display = 'none';
            if (noteListTable) noteListTable.style.display = 'block'; 
            if (noteForm) noteForm.reset();
            clearFormValidation(noteForm);
            currentEditingDoctorNoteId = null; 
        });
    }

    // Note Form Submission 
    if (noteForm) {
        noteForm.addEventListener('submit', async (event) => { 
            event.preventDefault();
            clearFormValidation(noteForm);

            if (!validateForm(noteForm)) {
                showToast('Please correct the highlighted fields.', 'warning');
                return;
            }

            showLoading(saveNoteBtn, 'Saving...');

            const noteData = {
                title: noteTitleInput.value.trim(),
                date: noteDateInput.value.trim(),
                content: noteContentInput.value.trim(),
                status: noteFormStatusInput.checked,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp() 
            };

            try {
                if (currentEditingDoctorNoteId) {
                   
                    await db.collection("doctorNotes").doc(currentEditingDoctorNoteId).update(noteData);
                    showToast('Doctor note updated successfully!', 'success');
                    console.log("Doctor note successfully updated!");
                } else {
                    // Add new note to Firestore
                    const newNoteData = {
                        ...noteData,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp() 
                    };
                    const docRef = await db.collection("doctorNotes").add(newNoteData);
                    showToast('Doctor note added successfully!', 'success');
                    console.log("Doctor note written with ID: ", docRef.id);
                }
            } catch (error) {
                showToast('Error saving doctor note.', 'danger');
                console.error("Error saving doctor note: ", error);
            } finally {
                hideLoading(saveNoteBtn, 'Save Note');
                noteForm.reset();
                clearFormValidation(noteForm);
                if (noteFormContainer) noteFormContainer.style.display = 'none';
                if (noteListTable) noteListTable.style.display = 'block';
                if (noteFormTitle) noteFormTitle.textContent = 'Add New Doctor\'s Note';
                currentEditingDoctorNoteId = null; // Reset
            }
        });
    }

    // IMPORTANT: Initial render of notes table from Firestore when section loads
    renderDoctorNotesTable();
}

    // --- 10. ARTICLE FUNCTIONS (FIRESTORE ENABLED) ---

    // Function to render Articles Table (listens to Firestore in real-time)
    function renderArticlesTable() {
        console.log("renderArticlesTable called!");
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
                articlesTableBody.innerHTML = ''; 
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
        
        db.collection("articles").doc(articleId).get()
            .then(doc => {
                if (doc.exists) {
                    const article = doc.data();
                    currentEditingArticleId = doc.id; // Store ID for update

                    // Populate form fields
                    if (articleTitleInput) articleTitleInput.value = article.title;
                    if (articleContentInput) articleContentInput.value = article.content;
                    if (articleImageUrlInput) articleImageUrlInput.value = article.imageUrl;
                    if (articleDescriptionInput) articleDescriptionInput.value = article.description;
                    if (articleCategoryInput) articleCategoryInput.value = article.category;
                    if (articleFormStatusInput) articleFormStatusInput.checked = (article.status === 'published'); 

                    if (articleFormTitle) {
                        articleFormTitle.textContent = 'Edit Article';
                    }

                    // Show the form and hide the table
                    if (articleFormContainer) articleFormContainer.style.display = 'block';
                    const articleListTable = document.getElementById('articleListTable'); 
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
        articleDescriptionInput = document.getElementById('articleDescription');
        articleCategoryInput = document.getElementById('articleCategory');
        articleFormStatusInput = document.getElementById('articleFormStatus');
        saveArticleBtn = document.getElementById('saveArticleBtn');
        cancelArticleFormBtn = document.getElementById('cancelArticleFormBtn');
        articlesTableBody = document.querySelector('#articleListTable tbody'); 
        articleFormTitle = document.getElementById('articleFormTitle');
        const articleListTable = document.getElementById('articleListTable'); 


        // Add New Article Button
        if (addNewArticleBtn) {
            addNewArticleBtn.addEventListener('click', () => {
                if (articleFormContainer) articleFormContainer.style.display = 'block';
                if (articleListTable) articleListTable.style.display = 'none'; 
                if (articleForm) articleForm.reset(); 
                if (articleFormTitle) articleFormTitle.textContent = 'Add New Article';
                currentEditingArticleId = null; 
                clearFormValidation(articleForm);
            });
        }

        // Cancel Article Form Button
        if (cancelArticleFormBtn) {
            cancelArticleFormBtn.addEventListener('click', () => {
                if (articleFormContainer) articleFormContainer.style.display = 'none';
                if (articleListTable) articleListTable.style.display = 'block'; 
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
                    description: articleDescriptionInput.value.trim(),
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
                            currentEditingArticleId = null; 
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
                                articleFormTitle.textContent = 'Add New Article'; 
                            }
                        });
                } else {
                    // Add new article to Firestore
                    const newArticleData = {
                        ...articleData,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp() 
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
        renderArticlesTable(); 
    }


    // --- 11. MAIN CONTENT RENDERING FUNCTION ---
    let currentAdminContentSection = 'dashboard'; // Keeps track of current section

    function showDashboardSection(sectionId) {
        
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
                            
                            <button class="btn btn-primary mt-3 d-block mx-auto view-all-notes-btn">View All</button>
                        </div>
                    </div>
                    <div class="col-12 col-lg-6">
                        <div class="card shadow-sm p-4">
                            <h3 class="card-title text-primary">Latest Articles</h3>
                            
                            <button class="btn btn-primary mt-3 d-block mx-auto view-all-articles-btn">View All</button>
                        </div>
                    </div>
                    
                </div>
            `;

            

// Function to load the latest articles for the dashboard summary (latest articles and recent doctor's note)
async function loadLatestArticlesSummary() {
    const latestArticlesList = document.getElementById('latestArticlesList');
    if (!latestArticlesList) {
        console.error("Latest Articles List (ID: latestArticlesList) not found.");
        return;
    }
    latestArticlesList.innerHTML = '<li class="list-group-item text-center text-muted">Loading articles...</li>'; // Show loading message

    try {
        const querySnapshot = await db.collection('articles')
                                      .where('status', '==', true) 
                                      .orderBy('createdAt', 'desc')
                                      .limit(3) 
                                      .get();

        let articlesHtml = '';
        if (querySnapshot.empty) {
            articlesHtml = '<li class="list-group-item text-center text-muted">No recent articles.</li>';
        } else {
            querySnapshot.forEach(doc => {
                const article = doc.data();
                const articleTitle = article.title || 'Untitled';
                
                articlesHtml += `<li class="list-group-item">
                                    <input type="checkbox" checked disabled>
                                    ${articleTitle}
                                  </li>`;
            });
        }
        latestArticlesList.innerHTML = articlesHtml;
    } catch (error) {
        console.error("Error loading latest articles summary:", error);
        latestArticlesList.innerHTML = '<li class="list-group-item text-center text-danger">Failed to load articles.</li>';
    }
}

// Function to load the recent doctor's notes for the dashboard summary
async function loadRecentDoctorsNotesSummary() {
    const recentDoctorsNotesList = document.getElementById('recentDoctorsNotesList');
    if (!recentDoctorsNotesList) {
        console.error("Recent Doctor's Notes List (ID: recentDoctorsNotesList) not found.");
        return;
    }
    recentDoctorsNotesList.innerHTML = '<li class="list-group-item text-center text-muted">Loading notes...</li>'; 

    try {
        const querySnapshot = await db.collection('doctorsNotes')
                                      .orderBy('createdAt', 'desc') 
                                      .limit(3) 
                                      .get();

        let notesHtml = '';
        if (querySnapshot.empty) {
            notesHtml = '<li class="list-group-item text-center text-muted">No recent doctor\'s notes.</li>';
        } else {
            querySnapshot.forEach(doc => {
                const note = doc.data();
                const noteContentPreview = (note.content || 'No content').substring(0, 50) + '...'; 
                notesHtml += `<li class="list-group-item">
                                    <input type="checkbox" checked disabled>
                                    ${noteContentPreview}
                                  </li>`;
            });
        }
        recentDoctorsNotesList.innerHTML = notesHtml;
    } catch (error) {
        console.error("Error loading recent doctor's notes summary:", error);
        recentDoctorsNotesList.innerHTML = '<li class="list-group-item text-center text-danger">Failed to load notes.</li>';
    }
}

// Check if we are on the Admin Dashboard page
if (window.location.pathname.includes('adminDashboard.html')) {
    loadLatestArticlesSummary();
    loadRecentDoctorsNotesSummary();
}
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
                            <input type="text" id="articleSearchInput" placeholder="Search articles..." class="form-control search-input">
                            <select id="articleCategoryFilter" class="form-select filter-select">
                                <option value="">All Categories</option>
                                <option value="Nutrition">Nutrition</option>
                                <option value="Health and Wellness">Health and Wellness</option>
                                <option value="Safety">Safety</option>
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
                                <label for="articleDescription" class="form-label">Description</label>
                                <input type="text" class="form-control" id="articleDescription" required>
                            </div>
                            <div class="mb-3">
                                <label for="articleCategory" class="form-label">Category</label>
                                <select class="form-select" id="articleCategory" required>
                                    <option value="">Select Category</option>
                                    <option value="Nutrition">Nutrition</option>
                                    <option value="Health and Wellness">Health and Wellness</option>
                                    <option value="Safety">Safety</option>
                                    
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="articleImageURL" class="form-label">Image URL</label>
                                <input type="url" class="form-control" id="articleImageURL" placeholder="">
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
                <div class="settings-section dashboard-section">
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

                        
                                <form id="adminProfileForm">
                                    <div class="mb-3">
                                        <label for="adminName" class="form-label">Name</label>
                                        <input type="text" class="form-control" id="adminName" required>
                                        <div class="invalid-feedback"></div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="adminEmail" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="adminEmail" readonly>
                                    </div>
                                    <button type="submit" class="btn btn-success" id="saveProfileDetailsBtn"><i class="fas fa-save"></i> Save Details</button>
                                </form>
                            </div>

                            <div class="tab-pane fade" id="security" role="tabpanel" aria-labelledby="security-tab">
                                <h4>Security Settings</h4>
                                <p>Manage your password and two-factor authentication here.</p>
                                <form id="changePasswordForm">
                                    <div class="mb-3">
                                        <label for="currentPassword" class="form-label">Current Password</label>
                                        <input type="password" class="form-control" id="currentPassword" required>
                                        <div class="invalid-feedback"></div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="newPassword" class="form-label">New Password</label>
                                        <input type="password" class="form-control" id="newPassword" required pattern=".{6,}" title="Password must be at least 6 characters long">
                                        <div class="invalid-feedback"></div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="confirmNewPassword" class="form-label">Confirm New Password</label>
                                        <input type="password" class="form-control" id="confirmNewPassword" required>
                                        <div class="invalid-feedback"></div>
                                    </div>
                                    <button type="submit" class="btn btn-warning" id="changePasswordBtn"><i class="fas fa-key"></i> Change Password</button>
                                </form>
                            </div>

                            <div class="tab-pane fade" id="notifications" role="tabpanel" aria-labelledby="notifications-tab">
                                <h4>Notification Settings</h4>
                                <p>Customize your notification preferences.</p>
                                <div class="form-check form-switch mb-3">
                                    <input class="form-check-input" type="checkbox" id="emailNotifications" checked>
                                    <label class="form-check-label" for="emailNotifications">Email Notifications</label>
                                </div>
                                <div class="form-check form-switch mb-3">
                                    <input class="form-check-input" type="checkbox" id="pushNotifications">
                                    <label class="form-check-label" for="pushNotifications">Push Notifications</label>
                                </div>
                                <button class="btn btn-primary">Save Notification Settings</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            console.error(`Section with ID "${sectionId}" not found.`);
            return; 
        }

        // Inject the HTML into the main content div
        if (dashboardContentDiv) {
            dashboardContentDiv.innerHTML = sectionHtml;
            currentAdminContentSection = sectionId; 
        } else {
            console.error("Dashboard content div not found.");
            return;
        }

        
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
            viewAllNotesBtn.addEventListener('click', () => {
                window.location.hash = '#doctorsNote'; 
            });
        
        } else if (sectionId === 'manageArticles') {
            setupArticleListeners();
            viewAllArticlesBtn.addEventListener('click', () => {
            window.location.hash = '#manageArticles'; 
        });
        } else if (sectionId === 'settings') {
            
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

    // Function to load and display user profile data
async function loadAdminProfile() {
    const user = firebase.auth().currentUser;
    if (user && db && adminNameInput && adminEmailInput) {
        
        adminEmailInput.value = user.email || '';

       
        try {
            const userDoc = await db.collection("users").doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                adminNameInput.value = userData.name || user.displayName || '';
                
            } else {
                
                adminNameInput.value = user.displayName || '';
               
            }
        } catch (error) {
            console.error("Error loading user profile from Firestore:", error);
            // Fallback to Auth display name and photoURL if Firestore fails
            adminNameInput.value = user.displayName || '';
           
            showToast('Could not load complete profile data.', 'warning');
        }
    } else {
        // Handle case where user is not logged in or elements aren't ready
        console.warn("User not logged in or profile elements not found for loading.");
        if (adminNameInput) adminNameInput.value = '';
        if (adminEmailInput) adminEmailInput.value = '';
        
    }
}

// Handler for saving profile details 
async function handleSaveProfileDetails(event) {
    event.preventDefault();
    clearFormValidation(adminProfileForm);

    if (!validateForm(adminProfileForm)) {
        showToast('Please correct the highlighted fields.', 'warning');
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        showToast('You must be logged in to update your profile.', 'danger');
        return;
    }

    showLoading(saveProfileDetailsBtn, 'Saving...');
    const newName = adminNameInput.value.trim();

    try {
        // 1. Update display name in Firebase Authentication
        await user.updateProfile({
            displayName: newName
        });
        console.log("Firebase Auth display name updated.");

        // 2. Update name in Firestore user document
        await db.collection("users").doc(user.uid).set({
            name: newName,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }); 
        console.log("Firestore user name updated.");

        showToast('Profile details updated successfully!', 'success');
    } catch (error) {
        console.error("Error updating profile details:", error);
        showToast(`Failed to update profile details: ${error.message}`, 'danger');
    } finally {
        hideLoading(saveProfileDetailsBtn, '<i class="fas fa-save"></i> Save Details');
    }
}
// Handler for changing password
async function handleChangePassword(event) {
    console.log("Password change form submitted!");
    event.preventDefault();
    clearFormValidation(changePasswordForm);

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;

    let isValid = true;

    if (!currentPassword.trim()) {
        setValidationFeedback(currentPasswordInput, false, 'Current password is required.');
        isValid = false;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
        setValidationFeedback(newPasswordInput, false, 'New password must be at least 6 characters.');
        isValid = false;
    }
    if (newPassword !== confirmNewPassword) {
        setValidationFeedback(confirmNewPasswordInput, false, 'New passwords do not match.');
        isValid = false;
    }
    if (newPassword === currentPassword) {
        setValidationFeedback(newPasswordInput, false, 'New password cannot be the same as current password.');
        isValid = false;
    }

    if (!isValid) {
        showToast('Please correct the highlighted fields.', 'warning');
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        showToast('You must be logged in to change your password.', 'danger');
        return;
    }

    showLoading(changePasswordBtn, 'Changing...');

    try {
        // Re-authenticate user before changing sensitive data like password or email
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(credential);
        console.log("User re-authenticated successfully.");

        await user.updatePassword(newPassword);
        showToast('Password changed successfully!', 'success');
        changePasswordForm.reset(); 
        clearFormValidation(changePasswordForm);
    } catch (error) {
        console.error("Error changing password:", error);
        let errorMessage = 'Failed to change password.';
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect current password.';
            setValidationFeedback(currentPasswordInput, false, errorMessage);
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'New password is too weak. Please use a stronger one.';
            setValidationFeedback(newPasswordInput, false, errorMessage);
        } else if (error.code === 'auth/requires-recent-login') {
            errorMessage = 'Please log out and log back in to change your password.';
        }
        showToast(errorMessage, 'danger');
    } finally {
        hideLoading(changePasswordBtn, '<i class="fas fa-key"></i> Change Password');
    }
}


// Listener setup for the Settings section
function setupSettingsListeners() {
    
    profilePictureDisplay = document.getElementById('profilePictureDisplay');
    profilePictureInput = document.getElementById('profilePictureInput');
    saveProfilePictureBtn = document.getElementById('saveProfilePictureBtn');
    adminProfileForm = document.getElementById('adminProfileForm');
    adminNameInput = document.getElementById('adminName');
    adminEmailInput = document.getElementById('adminEmail');
    saveProfileDetailsBtn = document.getElementById('saveProfileDetailsBtn');
    changePasswordForm = document.getElementById('changePasswordForm');
    currentPasswordInput = document.getElementById('currentPassword');
    newPasswordInput = document.getElementById('newPassword');
    confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    changePasswordBtn = document.getElementById('changePasswordBtn');


    // Load current profile data when the settings section is displayed
    loadAdminProfile();

    // Event Listeners for forms/buttons
    if (adminProfileForm) {
        adminProfileForm.addEventListener('submit', handleSaveProfileDetails);
    }
    if (saveProfilePictureBtn) {
        saveProfilePictureBtn.addEventListener('click', handleSaveProfilePicture);
    }
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    if (profilePictureInput) {
        profilePictureInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (profilePictureDisplay) {
                        profilePictureDisplay.src = e.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
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

    // Function to load recent doctor's notes for the admin dashboard
async function loadRecentDoctorNotesForAdmin(containerId, limit = 3) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Admin container with ID "${containerId}" not found for recent doctor notes.`);
        return;
    }
    container.innerHTML = '<p class="text-center text-muted">Loading recent notes...</p>';

    try {
        if (typeof db === 'undefined' || db === null) {
            throw new Error("Firestore 'db' object is not defined.");
        }

        const snapshot = await db.collection("doctorNotes")
            .orderBy("createdAt", "desc") 
            .limit(limit)
            .get();

        container.innerHTML = ''; 

        if (snapshot.empty) {
            container.innerHTML = '<p class="text-center text-muted">No recent doctor notes.</p>';
            return;
        }

        let htmlContent = '<ul class="list-group list-group-flush">';
        snapshot.forEach(doc => {
            const note = doc.data();
            const noteDate = note.createdAt ? new Date(note.createdAt.toDate()).toLocaleDateString() : 'N/A';
            const statusIcon = note.status ? '<i class="fas fa-check-square text-success"></i>' : '<i class="fas fa-square text-warning"></i>'; // Font Awesome icons

            htmlContent += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        ${statusIcon} <strong>${note.title}</strong>
                        <small class="text-muted ms-2">${noteDate}</small>
                    </div>
                    <a href="doctor-note-detail.html?id=${doc.id}" class="btn btn-sm btn-outline-info">View</a>
                </li>
            `;
        });
        htmlContent += '</ul>';
        container.innerHTML = htmlContent;

    } catch (error) {
        console.error("Error loading recent doctor notes for admin:", error);
        container.innerHTML = '<p class="text-center text-danger">Error loading notes.</p>';
    }
}


async function loadLatestArticlesForAdmin(containerId, limit = 3) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Admin container with ID "${containerId}" not found for latest articles.`);
        return;
    }
    container.innerHTML = '<p class="text-center text-muted">Loading latest articles...</p>';

    try {
        if (typeof db === 'undefined' || db === null) {
            throw new Error("Firestore 'db' object is not defined.");
        }

        const snapshot = await db.collection("articles")
            .orderBy("createdAt", "desc") 
            .limit(limit)
            .get();

        container.innerHTML = ''; 

        if (snapshot.empty) {
            container.innerHTML = '<p class="text-center text-muted">No recent articles.</p>';
            return;
        }

        let htmlContent = '<ul class="list-group list-group-flush">';
        snapshot.forEach(doc => {
            const article = doc.data();
            const articleDate = article.createdAt ? new Date(article.createdAt.toDate()).toLocaleDateString() : 'N/A';
            const statusIcon = article.status ? '<i class="fas fa-check-square text-success"></i>' : '<i class="fas fa-square text-warning"></i>';

            htmlContent += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        ${statusIcon} <strong>${article.title}</strong>
                        <small class="text-muted ms-2">${articleDate}</small>
                    </div>
                    <a href="article-details.html?id=${doc.id}" class="btn btn-sm btn-outline-info">View</a>
                </li>
            `;
        });
        htmlContent += '</ul>';
        container.innerHTML = htmlContent;

    } catch (error) {
        console.error("Error loading latest articles for admin:", error);
        container.innerHTML = '<p class="text-center text-danger">Error loading articles.</p>';
    }
}


async function loadAllArticlesForAdmin(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Admin container with ID "${containerId}" not found for all articles.`);
        return;
    }
    container.innerHTML = '<p class="text-center text-muted">Loading all articles...</p>';

    try {
        if (typeof db === 'undefined' || db === null) {
            throw new Error("Firestore 'db' object is not defined.");
        }

        const snapshot = await db.collection("articles")
            .orderBy("createdAt", "desc") // Order all articles by date
            .get();

        container.innerHTML = ''; 

        if (snapshot.empty) {
            container.innerHTML = '<p class="text-center text-muted">No articles found.</p>';
            return;
        }

        let htmlContent = '<ul class="list-group list-group-flush">';
        snapshot.forEach(doc => {
            const article = doc.data();
            const articleDate = article.createdAt ? new Date(article.createdAt.toDate()).toLocaleDateString() : 'N/A';
            const statusText = article.status ? 'Published' : 'Draft';
            const statusClass = article.status ? 'text-success' : 'text-warning';

            htmlContent += `
                <li class="list-group-item d-flex align-items-center">
                    <img src="${article.imageUrl || 'path/to/placeholder.jpg'}" alt="${article.title}" class="img-thumbnail me-3" style="width: 80px; height: 80px; object-fit: cover;">
                    <div class="flex-grow-1">
                        <h6>${article.title}</h6>
                        <p class="mb-1 text-muted small">${article.category} | ${articleDate}</p>
                        <span class="badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="ms-auto">
                        <a href="edit-article.html?id=${doc.id}" class="btn btn-sm btn-outline-primary me-2">Edit</a>
                        <button class="btn btn-sm btn-outline-danger" data-article-id="${doc.id}" onclick="deleteArticle('${doc.id}')">Delete</button>
                    </div>
                </li>
            `;
        });
        htmlContent += '</ul>';
        container.innerHTML = htmlContent;

    } catch (error) {
        console.error("Error loading all articles for admin:", error);
        container.innerHTML = '<p class="text-center text-danger">Error loading all articles.</p>';
    }
}
 // function to filter articles
function filterArticles() {
    const searchInput = document.getElementById('articleSearchInput');
    const categorySelect = document.getElementById('articleCategoryFilter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedCategory = categorySelect ? categorySelect.value : ''; 

    const tableRows = document.querySelectorAll('.admin-articles-table tbody tr');

    tableRows.forEach(row => {
        // Skip any loading or "no articles" messages, assuming they are within a single <td> with specific text
        const isLoaderRow = row.querySelector('td.text-center') && row.querySelector('td.text-center').textContent.includes('Loading');
        const isNoArticlesRow = row.querySelector('td.text-center') && row.querySelector('td.text-center').textContent.includes('No articles');

        if (isLoaderRow || isNoArticlesRow) {
            row.style.display = ''; s
            return; 
        }

        
        const titleCell = row.querySelector('td:nth-child(1)'); 
        const categoryCell = row.querySelector('td:nth-child(2)'); 

        const articleTitle = titleCell ? titleCell.textContent.toLowerCase() : '';
        const articleCategory = categoryCell ? categoryCell.textContent : '';

        // Determine if the row matches the search term and selected category
        const matchesSearch = articleTitle.includes(searchTerm);
        const matchesCategory = (selectedCategory === '' || articleCategory === selectedCategory);

        // Show or hide the row based on the filter results
        if (matchesSearch && matchesCategory) {
            row.style.display = ''; // Show the row
        } else {
            row.style.display = 'none'; // Hide the row
        }
    });
}

if (window.location.pathname.includes('Admin/Dashboard.html') || window.location.hash === '#manageArticles') {
   
    loadArticlesIntoAdminTable();

    
    const articleSearchInput = document.getElementById('articleSearchInput');
    if (articleSearchInput) {
        articleSearchInput.addEventListener('input', filterArticles); 
    }

    const articleCategoryFilter = document.getElementById('articleCategoryFilter');
    if (articleCategoryFilter) {
        articleCategoryFilter.addEventListener('change', filterArticles); 
    }

    
    const globalSearchBar = document.getElementById('globalSearchBar');
    if (globalSearchBar) {
        globalSearchBar.addEventListener('input', () => {
            
            if (articleSearchInput) {
                articleSearchInput.value = globalSearchBar.value; // Sync the value
                filterArticles(); 
            }
            // Add other logic here if global search affects other parts of the dashboard
        });
    }
}
// Function to handle article deletion (requires Firebase Authentication/Admin SDK for real deletion)
// This is a placeholder for now. Real deletion would happen on the server-side with Cloud Functions.
async function deleteArticle(articleId) {
    if (confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
        try {
            if (typeof db === 'undefined' || db === null) {
                throw new Error("Firestore 'db' object is not defined.");
            }
            
            console.log(`Simulating deletion of article: ${articleId}`); 
            alert('Article deleted successfully! (Simulated)'); 
            // After deletion, reload the list
            loadAllArticlesForAdmin('all-articles-admin');
            loadLatestArticlesForAdmin('latest-articles-admin'); // Also update latest
        } catch (error) {
            console.error("Error deleting article:", error);
            alert(`Failed to delete article: ${error.message}`);
        }
    }
}
}); // End DOMContentLoaded