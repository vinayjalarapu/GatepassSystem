const API_URL = 'http://localhost:3000/api';

console.log('Student.js loaded successfully');
console.log('API URL:', API_URL);

// Show alert message
function showAlert(message, type = 'success') {
    console.log('Alert:', message, 'Type:', type);
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Handle form submission
const form = document.getElementById('requestForm');
if (form) {
    console.log('Form found, adding event listener');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted!');

        const formData = {
            studentId: document.getElementById('studentId').value,
            studentName: document.getElementById('studentName').value,
            reason: document.getElementById('reason').value,
            exitDate: document.getElementById('exitDate').value,
            exitTime: document.getElementById('exitTime').value,
            returnDate: document.getElementById('returnDate').value,
            returnTime: document.getElementById('returnTime').value
        };

        console.log('Form data:', formData);

        try {
            console.log('Sending request to:', `${API_URL}/requests`);
            
            const response = await fetch(`${API_URL}/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('Response status:', response.status);
            
            const result = await response.json();
            console.log('Response data:', result);

            if (result.success) {
                showAlert('Request submitted successfully! Request ID: ' + result.data.id, 'success');
                document.getElementById('requestForm').reset();
                
                const searchId = document.getElementById('searchStudentId').value;
                if (searchId === formData.studentId) {
                    loadStudentRequests();
                }
            } else {
                showAlert(result.message, 'error');
            }
        } catch (error) {
            console.error('Error occurred:', error);
            showAlert('Failed to submit request. Make sure the server is running. Error: ' + error.message, 'error');
        }
    });
} else {
    console.error('FORM NOT FOUND! Check if id="requestForm" exists in HTML');
}

// Load student requests
async function loadStudentRequests() {
    const studentId = document.getElementById('searchStudentId').value.trim();

    if (!studentId) {
        showAlert('Please enter Student ID', 'error');
        return;
    }

    const container = document.getElementById('requestsContainer');
    container.innerHTML = '<div class="loading">Loading requests...</div>';

    try {
        console.log('Loading requests for:', studentId);
        const response = await fetch(`${API_URL}/requests/student/${studentId}`);
        const result = await response.json();
        console.log('Requests loaded:', result);

        if (result.success) {
            displayRequests(result.data);
        } else {
            container.innerHTML = '<div class="alert alert-error">Failed to load requests</div>';
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        container.innerHTML = '<div class="alert alert-error">Failed to connect to server. Make sure backend is running.</div>';
    }
}

// Display requests
function displayRequests(requests) {
    const container = document.getElementById('requestsContainer');

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No requests found</p>
            </div>
        `;
        return;
    }

    // Sort by submitted date (newest first)
    requests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    const html = requests.map(request => `
        <div class="request-card">
            <div class="request-header">
                <span class="request-id">${request.id}</span>
                <span class="status-badge status-${request.status}">${request.status}</span>
            </div>

            <div class="request-details">
                <div class="detail-row">
                    <span class="detail-label">Student Name:</span>
                    <span class="detail-value">${request.studentName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Reason:</span>
                    <span class="detail-value">${request.reason}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Exit Date/Time:</span>
                    <span class="detail-value">${request.exitDate} at ${request.exitTime}</span>
                </div>
                ${request.returnDate ? `
                    <div class="detail-row">
                        <span class="detail-label">Return Date/Time:</span>
                        <span class="detail-value">${request.returnDate} at ${request.returnTime}</span>
                    </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Submitted:</span>
                    <span class="detail-value">${new Date(request.submittedAt).toLocaleString()}</span>
                </div>
                ${request.moderatorRemarks ? `
                    <div class="detail-row">
                        <span class="detail-label">Moderator Remarks:</span>
                        <span class="detail-value">${request.moderatorRemarks}</span>
                    </div>
                ` : ''}
            </div>

            ${request.status === 'approved' && request.qrCode ? `
                <div class="qr-code-container">
                    <h4 style="color: #8f191d; margin-bottom: 10px;">Your Gate Pass</h4>
                    <p style="font-size: 0.9rem; color: #03505d; margin-bottom: 15px;">Show this QR code to the gatekeeper</p>
                    <img src="${request.qrCode}" alt="QR Code">
                    <p style="font-size: 0.85rem; color: #666; margin-top: 10px;">Pass ID: ${request.id}</p>
                </div>
            ` : ''}
        </div>
    `).join('');

    container.innerHTML = `<div class="requests-container">${html}</div>`;
}

// Set minimum date to today
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    const today = new Date().toISOString().split('T')[0];
    const exitDateInput = document.getElementById('exitDate');
    const returnDateInput = document.getElementById('returnDate');
    
    if (exitDateInput) {
        exitDateInput.min = today;
        console.log('Exit date min set to:', today);
    }
    if (returnDateInput) {
        returnDateInput.min = today;
        console.log('Return date min set to:', today);
    }
});

console.log('Student.js file fully loaded');