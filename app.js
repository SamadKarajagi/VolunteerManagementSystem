// app.js

// --- CONFIGURATION & MOCK DATA ---
const ORGANIZER_CREDENTIALS = { username: 'admin', password: '123' };
const ORGANIZER_ROLE_KEY = 'organizerLoggedIn';
const VOLUNTEER_ROLE_KEY = 'volunteerData';
const EVENT_DATA_KEY = 'eventsData';
// Load events from local storage, or start with an empty array
let events = JSON.parse(localStorage.getItem(EVENT_DATA_KEY)) || [];

// --- CORE UTILITY FUNCTIONS ---

function getUserRole() {
    if (localStorage.getItem(ORGANIZER_ROLE_KEY) === 'true') {
        return 'organizer';
    }
    if (localStorage.getItem(VOLUNTEER_ROLE_KEY)) {
        return 'volunteer';
    }
    return null;
}

function saveEvents() {
    localStorage.setItem(EVENT_DATA_KEY, JSON.stringify(events));
}

function logoutUser() {
    localStorage.removeItem(ORGANIZER_ROLE_KEY);
    localStorage.removeItem(VOLUNTEER_ROLE_KEY);
    alert('You have been signed out.');
    // Redirects back to the dedicated home page
    window.location.href = 'home.html';
}

// --- GOOGLE CALENDAR INTEGRATION ---

function getGoogleCalendarLink(event, role) {
    const title = `Volunteer: ${role.name} for ${event.title}`;
    const details = `Event: ${event.description}. Your role is ${role.name}.`;
    const dateParts = event.date.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!dateParts) return '#';
        
    const [_, day, month, year] = dateParts;
    // Assuming 9 AM start, 4-hour shift for demonstration
    const start = new Date(year, month - 1, day, 9, 0, 0); 
    const end = new Date(start.getTime() + (4 * 60 * 60 * 1000));
    
    const formatTime = (date) => date.toISOString().replace(/[-:]/g, '').substring(0, 15) + 'Z';
    const startString = formatTime(start);
    const endString = formatTime(end);

    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams({
        text: title, details: details, dates: `${startString}/${endString}`, sf: true, output: 'xml'
    });
    return `${baseUrl}&${params.toString()}`;
}


// --- CERTIFICATE DOWNLOAD LOGIC ---

function simulateCertificateDownload(volunteerName, eventTitle, roleName) {
    // 1. Define the HTML structure for the certificate
    const certificateHTML = `
        <div class="certificate-container" id="certificate-template">
            
            <div class="cert-header">
                <img src="https://tse2.mm.bing.net/th/id/OIP.AEJUBUcg-VZvcDShXhj36AAAAA?pid=Api&P=0&h=180" alt="College Logo" class="cert-logo">
                <div class="cert-title">
                    <h2>BILURU GURUBASAV MAHASWAMIJI INSTITUTE OF TECHNOLOGY</h2>
                    <h2>MUDHOL-587313</h2>
                </div>
                <img src="https://tse2.mm.bing.net/th/id/OIP.bDQQBgndPi0x_HmIasmiwQAAAA?pid=Api&P=0&h=180" alt="Founder" class="cert-logo">
            </div>

            <div class="cert-body">
                <p class="cert-badge-text">VOLUNTEER</p>
                <p class="cert-awarded-to">is hereby awarded to</p>
                <p class="cert-name">${volunteerName.toUpperCase()}</p>
                
                <div class="cert-details">
                    for successfully contributing as a 
                    <strong>${roleName}</strong> 
                    <br>
                    during the event: 
                    <strong>"${eventTitle}"</strong>.
                    <br>
                    <span style="font-size: 0.9em;">We appreciate your dedication and service.</span>
                </div>
            </div>

            <div class="cert-footer">
                <div class="cert-signature">
                    Authorized Signatory
                    <div>Date: ${new Date().toLocaleDateString('en-GB')}</div>
                </div>
                <div class="cert-signature">
                    Event Coordinator
                    <div>ID: ${Math.floor(Math.random() * 90000) + 10000}</div>
                </div>
            </div>
        </div>
    `;

    // 2. Temporarily inject the certificate HTML into the document
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.innerHTML = certificateHTML;
    document.body.appendChild(tempDiv);
    
    const certElement = document.getElementById('certificate-template');

    // 3. Use html2canvas to render the HTML into a canvas/image
    if (typeof html2canvas === 'undefined') {
        alert("Error: The html2canvas library is missing. Please check your index.html file.");
        document.body.removeChild(tempDiv);
        return;
    }

    html2canvas(certElement, { 
        scale: 2, 
        logging: false,
        useCORS: true
    }).then(canvas => {
        // 4. Trigger the download
        const link = document.createElement('a');
        link.download = `${volunteerName.replace(/\s/g, '_')}_Certificate.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // 5. Clean up the temporary element
        document.body.removeChild(tempDiv);
        alert(`Certificate for ${volunteerName} downloaded as a PNG image!`);
    });
}


// --- AUTHENTICATION & INITIALIZATION ---

function initializeAuth() {
    const role = getUserRole();
    if (role) { window.location.href = 'index.html'; return; } // Redirect if already logged in

    // --- HOME PAGE LOGIC (Role Selection and Form Switching) ---
    
    const selectionButtons = document.getElementById('selection-buttons');
    const organizerPanel = document.getElementById('organizer-form-panel');
    const studentPanel = document.getElementById('student-form-panel');
    const organizerForm = document.getElementById('organizer-signin-form');
    const studentForm = document.getElementById('student-signup-form');
    const btnOrganizer = document.getElementById('btn-organizer');
    const btnVolunteer = document.getElementById('btn-volunteer');
    const backLinks = document.querySelectorAll('#back-to-selection, #back-to-selection-2'); 

    function showPanel(panelToShow) {
        selectionButtons?.classList.add('hidden');
        organizerPanel?.classList.add('hidden');
        studentPanel?.classList.add('hidden');

        if (panelToShow === 'selection') {
            selectionButtons?.classList.remove('hidden');
        } else if (panelToShow === 'organizer') {
            organizerPanel?.classList.remove('hidden');
        } else if (panelToShow === 'volunteer') {
            studentPanel?.classList.remove('hidden');
        }
    }

    // EVENT LISTENERS FOR ROLE SELECTION
    btnOrganizer?.addEventListener('click', () => { showPanel('organizer'); });
    btnVolunteer?.addEventListener('click', () => { showPanel('volunteer'); });
    backLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPanel('selection');
        });
    });

    // Organizer Sign In Handler
    organizerForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('organizer-username').value;
        const password = document.getElementById('organizer-password').value;

        if (username === ORGANIZER_CREDENTIALS.username && password === ORGANIZER_CREDENTIALS.password) {
            localStorage.setItem(ORGANIZER_ROLE_KEY, 'true');
            localStorage.removeItem(VOLUNTEER_ROLE_KEY); // Clear volunteer session
            alert('Organizer Sign In Successful!');
            window.location.href = 'index.html'; 
        } else {
            alert('Invalid Organizer Username or Password. Use admin/123.');
        }
    });

    // Student Sign Up Handler
    studentForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('student-name').value.trim();
        const email = document.getElementById('student-email').value.trim();
        const studentId = document.getElementById('student-id').value.trim();
        // Password is not used for session but is captured for form realism
        
        const studentData = { name, email, studentId, role: 'volunteer' };
        localStorage.setItem(VOLUNTEER_ROLE_KEY, JSON.stringify(studentData));
        localStorage.removeItem(ORGANIZER_ROLE_KEY); // Clear organizer session

        alert(`Welcome, ${name}! Your account is created. Redirecting to Event Hub.`);
        window.location.href = 'index.html'; 
    });
}

function checkAuthAndRenderHub() {
    const role = getUserRole();
    if (!role) { window.location.href = 'home.html'; return; }
    
    const organizerSection = document.getElementById('organizer-section');
    const dashboardLinkBtn = document.getElementById('dashboard-link-btn');

    if (organizerSection) organizerSection.classList.toggle('hidden', role !== 'organizer');
    if (dashboardLinkBtn) dashboardLinkBtn.classList.toggle('hidden', role !== 'organizer');

    attachHubListeners();
    renderEvents();
}

function checkAuthAndRenderDashboard() {
    const role = getUserRole();
    if (role !== 'organizer') {
        alert('Access Denied. Organizers only.');
        window.location.href = 'home.html';
        return;
    }
    renderOrganizerDashboard();
}


// --- HUB EVENT MANAGEMENT (index.html) ---

function attachHubListeners() {
    // Event Creation Form
    document.getElementById('event-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('event-date').value;
        const description = document.getElementById('event-desc').value;
        const roleName = document.getElementById('role-name').value;
        const totalSlots = +document.getElementById('role-slots').value; 
        
        const newRole = { name: roleName, totalSlots: totalSlots, volunteers: [] };
        const newEvent = { title: title, date: date, description: description, roles: [newRole], id: Date.now() }; 
        
        events.push(newEvent);
        saveEvents();
        this.reset();
        renderEvents();
        alert(`Event "${title}" posted!`);
    });

    // Close Modals
    document.getElementById('closeModalBtn')?.addEventListener('click', () => document.getElementById('signUpModal').classList.add('hidden'));
    document.getElementById('closeActionModal')?.addEventListener('click', () => document.getElementById('volunteerActionModal').classList.add('hidden'));
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('signUpModal')) document.getElementById('signUpModal').classList.add('hidden');
        if (event.target === document.getElementById('volunteerActionModal')) document.getElementById('volunteerActionModal').classList.add('hidden');
    });

    // Volunteer Sign-up Form Submission (UPDATED for BACKEND EMAIL REQUEST)
    document.getElementById('volunteer-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const eventIndex = +document.getElementById('modal-event-index').value;
        const roleIndex = +document.getElementById('modal-role-index').value;
        const volunteerName = document.getElementById('volunteer-name').value.trim(); 
        const volunteerEmail = document.getElementById('volunteer-email').value.trim();
        const event = events[eventIndex];
        const role = event.roles[roleIndex];
        
        if (role.volunteers.some(v => v.email === volunteerEmail)) {
            alert('You have already signed up for this role!');
            document.getElementById('signUpModal').classList.add('hidden');
            return;
        }
        
        const newVolunteer = { name: volunteerName, email: volunteerEmail, timestamp: new Date().toISOString() };
        
        // 1. Handle Frontend Data (Save to Local Storage)
        role.volunteers.push(newVolunteer);
        saveEvents();
        renderEvents();

        // 2. Prepare Data for Email Server
        const emailData = {
            name: volunteerName,
            email: volunteerEmail,
            eventTitle: event.title,
            roleName: role.name,
            date: event.date
        };

        // 3. Send Request to Backend Server (Requires Node.js server running on port 3000)
        fetch('http://localhost:3000/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData),
        })
        .then(response => response.json())
        .then(data => {
            let emailMessage = data.success ? 
                `Confirmation email request successfully sent to ${volunteerEmail}!` : 
                `Sign-up successful, but email failed to send (Check server logs).`;
            alert(`Success! ${volunteerName} signed up for ${role.name}. ${emailMessage}`);
        })
        .catch(error => {
            console.error('Error sending email request to server:', error);
            alert('Sign-up successful, but connection error while sending email.');
        });

        document.getElementById('signUpModal').classList.add('hidden');
    });
    
    // Volunteer Cancellation/Swap Form Submission
    document.getElementById('cancelSwapForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const eventIndex = +document.getElementById('action-event-index').value;
        const roleIndex = +document.getElementById('action-role-index').value;
        const actionType = document.getElementById('volunteer-action-type').value;
        
        // Check if the volunteerData key exists before parsing
        const volunteerDataString = localStorage.getItem(VOLUNTEER_ROLE_KEY);
        if (!volunteerDataString) {
             alert("Error: Volunteer data not found.");
             document.getElementById('volunteerActionModal').classList.add('hidden');
             return;
        }
        
        const volunteerEmail = JSON.parse(volunteerDataString).email;
        const role = events[eventIndex].roles[roleIndex];
        const volIndex = role.volunteers.findIndex(v => v.email === volunteerEmail);

        if (actionType === 'cancel' && volIndex !== -1) {
            role.volunteers.splice(volIndex, 1);
            saveEvents();
            renderEvents();
            alert(`Successfully cancelled sign-up for ${role.name}. Slot is now free.`);
        } else if (actionType === 'swap') {
            alert(`Swap proposed for ${role.name}. Organizer will be notified.`);
        }
        document.getElementById('volunteerActionModal').classList.add('hidden');
    });
}

function renderEvents() {
    const eventsListContainer = document.getElementById('events-list');
    if (!eventsListContainer) return;

    eventsListContainer.innerHTML = '';
    const role = getUserRole();
    if (events.length === 0) {
        eventsListContainer.innerHTML = '<p>No events posted yet. Check back soon!</p>'; return;
    }

    const volunteerData = JSON.parse(localStorage.getItem(VOLUNTEER_ROLE_KEY));

    events.forEach((event, eventIndex) => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-item';
        let rolesHTML = '';

        event.roles.forEach((roleObj, roleIndex) => {
            const remainingSlots = roleObj.totalSlots - roleObj.volunteers.length;
            const isFull = remainingSlots <= 0;
            
            const isVolunteerSignedUp = volunteerData && roleObj.volunteers.some(v => v.email === volunteerData.email);
            
            let actionButton = '';

            if (role === 'volunteer') {
                if (isVolunteerSignedUp) {
                    const volunteerName = volunteerData.name;
                    
                    const certButton = `
                        <button class="certificate-btn create-btn" onclick="simulateCertificateDownload('${volunteerName}', '${event.title}', '${roleObj.name}')">
                            <i class="fas fa-certificate"></i> Get Certificate
                        </button>
                    `;
                    
                    actionButton = `
                        <button class="cancel-btn create-btn" onclick="openVolunteerActionModal(${eventIndex}, ${roleIndex}, true)">
                            <i class="fas fa-times-circle"></i> Cancel/Swap
                        </button>
                        
                        ${certButton} 
                        
                        <a href="${getGoogleCalendarLink(event, roleObj)}" target="_blank" class="calendar-btn create-btn">
                            <i class="fab fa-google"></i> Add to Calendar
                        </a>
                    `;
                } else if (isFull) {
                    actionButton = `<button class="sign-up-btn create-btn" disabled>Role Full</button>`;
                } else {
                    actionButton = `
                        <button 
                            class="sign-up-btn create-btn" 
                            data-event-index="${eventIndex}" 
                            data-role-index="${roleIndex}"
                        >
                            Sign Up
                        </button>
                    `;
                }
            } else if (role === 'organizer') {
                 actionButton = `<a href="dashboard.html" class="create-btn" style="background-color: #008080;">
                    <i class="fas fa-chart-line"></i> View Roster
                 </a>`;
            }

            rolesHTML += `
                <li class="role-item">
                    <div>
                        <strong><i class="fas fa-user-tag"></i> ${roleObj.name}</strong> 
                        <br>
                        Slots: ${remainingSlots}/${roleObj.totalSlots} Remaining
                    </div>
                    <div style="display: flex; gap: 5px;">${actionButton}</div> 
                </li>
            `;
        });
        
        const deleteButton = (role === 'organizer') ? 
            `<button class="delete-event-btn" onclick="deleteEvent(${eventIndex})" title="Delete this entire event"><i class="fas fa-trash"></i> Delete Event</button>` : '';

        eventDiv.innerHTML = `
            <h3><i class="fas fa-calendar-alt"></i> ${event.title}</h3>
            ${deleteButton}
            <p><strong>Date/Time:</strong> ${event.date}</p>
            <p>${event.description}</p>
            <h4>Available Roles:</h4>
            <ul class="role-list">${rolesHTML}</ul>
        `;
        eventsListContainer.appendChild(eventDiv);
    });

    if (role === 'volunteer') {
        // Re-attach listeners for the Sign Up buttons
        document.querySelectorAll('.sign-up-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                if (e.target.disabled) return; 
                const eventIndex = e.target.dataset.eventIndex;
                const roleIndex = e.target.dataset.roleIndex;
                showSignUpModal(eventIndex, roleIndex);
            });
        });
    }
}

function deleteEvent(eventIndex) {
    if (!confirm(`Are you sure you want to delete the event: "${events[eventIndex].title}"?`)) { return; }
    events.splice(eventIndex, 1);
    saveEvents();
    renderEvents();
    alert('Event deleted.');
}

function showSignUpModal(eventIndex, roleIndex) {
    const event = events[eventIndex];
    const role = event.roles[roleIndex];
    const volunteerData = JSON.parse(localStorage.getItem(VOLUNTEER_ROLE_KEY)); 
    
    document.getElementById('modal-event-index').value = eventIndex;
    document.getElementById('modal-role-index').value = roleIndex;
    document.getElementById('modal-event-details').textContent = 
        `Signing up for: ${event.title} - ${role.name}`;
    
    if (volunteerData) {
        document.getElementById('volunteer-name').value = volunteerData.name;
        document.getElementById('volunteer-email').value = volunteerData.email;
        document.getElementById('volunteer-name').readOnly = true;
        document.getElementById('volunteer-email').readOnly = true;
    }
    document.getElementById('signUpModal').classList.remove('hidden');
}

function openVolunteerActionModal(eventIndex, roleIndex) {
    const event = events[eventIndex];
    const role = event.roles[roleIndex];
    document.getElementById('action-event-index').value = eventIndex;
    document.getElementById('action-role-index').value = roleIndex;
    document.getElementById('action-event-details').textContent = 
        `Action for: ${event.title} - ${role.name}`;
    document.getElementById('volunteerActionModal').classList.remove('hidden');
}


// --- QR CODE GENERATION & DASHBOARD (dashboard.html) ---

function generateQRCode(eventTitle, roleName, containerId, eventId) {
    const qrCodeElement = document.getElementById(containerId);
    if (!qrCodeElement) return;

    qrCodeElement.innerHTML = '';
    const uniqueData = `EventID:${event.id || eventId}|Role:${roleName.replace(/\s/g, '_')}`;

    if (typeof QRCode !== 'undefined') {
        new QRCode(qrCodeElement, {
            text: uniqueData,
            width: 100,
            height: 100,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    } else {
         qrCodeElement.innerHTML = '[QR Code Library Missing]';
    }
}


function renderOrganizerDashboard() {
    const eventsData = JSON.parse(localStorage.getItem(EVENT_DATA_KEY)) || [];
    const container = document.getElementById('events-dashboard-list');
    if (!container) return;

    container.innerHTML = '';

    if (eventsData.length === 0) {
        container.innerHTML = '<h2>No Events Available.</h2><p>Please create a new event on the main hub page.</p>';
        return;
    }

    eventsData.forEach((event, eventIndex) => {
        let eventHTML = `<div class="event-dashboard-item">
            <h3>
                <span><i class="fas fa-calendar-check"></i> ${event.title} (${event.date})</span>
                <button class="export-btn" onclick="exportEventToCSV(${eventIndex})"><i class="fas fa-file-csv"></i> Export CSV</button>
            </h3>
            <p><strong>Description:</strong> ${event.description}</p>
            <h4>Roles Roster:</h4>`;
        
        event.roles.forEach((role, roleIndex) => {
            const volunteerCount = role.volunteers.length;
            const coveragePercent = role.totalSlots > 0 ? ((volunteerCount / role.totalSlots) * 100).toFixed(0) : 0;
            const qrContainerId = `qr-code-${eventIndex}-${roleIndex}`;
            
            eventHTML += `
                <div style="margin-top: 20px;">
                    <h5 style="color: #00796b;">${role.name} (${volunteerCount}/${role.totalSlots} Slots Filled | Coverage: ${coveragePercent}%)</h5>
                    
                    <div class="qr-code-container">
                        <strong>Unique Attendance QR Code:</strong> (Event ID: ${event.id || eventIndex})
                        <div id="${qrContainerId}" class="qr-code-display"></div>
                    </div>

                    <table class="roster-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Signed Up At</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            if (volunteerCount === 0) {
                eventHTML += '<tr><td colspan="5" style="text-align:center;">No volunteers signed up for this role.</td></tr>';
            } else {
                role.volunteers.forEach((volunteer, volIndex) => {
                    const date = new Date(volunteer.timestamp);
                    eventHTML += `
                        <tr>
                            <td>${volIndex + 1}</td>
                            <td>${volunteer.name}</td>
                            <td>${volunteer.email}</td>
                            <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
                            <td><button onclick="removeVolunteer(${eventIndex}, ${roleIndex}, ${volIndex})" style="color: red; border: none; background: none; cursor: pointer;">Remove</button></td>
                        </tr>`;
                });
            }
            
            eventHTML += `</tbody></table></div>`;
        });

        eventHTML += `</div>`;
        container.innerHTML += eventHTML;
    });
    
    eventsData.forEach((event, eventIndex) => {
        event.roles.forEach((role, roleIndex) => {
            const qrContainerId = `qr-code-${eventIndex}-${roleIndex}`;
            generateQRCode(event.title, role.name, qrContainerId, event.id || eventIndex);
        });
    });
}

function exportEventToCSV(eventIndex) {
    const event = events[eventIndex];
    
    let csvContent = "Event,Date,Role Name,Volunteer Name,Volunteer Email,Signed Up At\n";
    event.roles.forEach(role => {
        role.volunteers.forEach(volunteer => {
            const row = [
                `"${event.title.replace(/"/g, '""')}"`,
                `"${event.date.replace(/"/g, '""')}"`,
                `"${role.name.replace(/"/g, '""')}"`,
                `"${volunteer.name.replace(/"/g, '""')}"`,
                volunteer.email,
                new Date(volunteer.timestamp).toLocaleString()
            ].join(",");
            csvContent += row + "\n";
        });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { 
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `VolunteerRoster_${event.title.replace(/\s/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    alert(`CSV for "${event.title}" generated successfully!`);
}

function removeVolunteer(eventIndex, roleIndex, volIndex) {
    if (!confirm('Are you sure you want to remove this volunteer from the role?')) { return; }
    events[eventIndex].roles[roleIndex].volunteers.splice(volIndex, 1);
    saveEvents();
    alert('Volunteer removed and slot freed.');
    renderOrganizerDashboard();
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    // Check which page we are on and initialize the correct function
    const pathname = window.location.pathname;
    
    if (pathname.endsWith('home.html') || pathname === '/') {
        initializeAuth();
    } else if (pathname.endsWith('index.html')) {
        checkAuthAndRenderHub();
    } else if (pathname.endsWith('dashboard.html')) {
        checkAuthAndRenderDashboard();
    }
});