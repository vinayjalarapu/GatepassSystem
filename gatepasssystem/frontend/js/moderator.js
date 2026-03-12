const API_URL = 'http://localhost:3000/api';

let currentAction = null;
let currentRequestId = null;

// Show alert message
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Load requests based on filter
async function loadRequests(filter = 'pending') {
    const container = document.getElementById('requestsContainer');
    container.innerHTML = '<div class="loading">Loading requests...</div>';

    try {
        let url = `${API_URL}/requests`;
        if (filter === 'pending') {
            url = `${API_URL}/requests/pending`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            let requests = result.data;

            // Apply filter
            if (filter === 'approved') {
                requests = requests.filter(r => r.status === 'approved');
            } else if (filter === 'rejected') {
                requests = requests.filter(r => r.status === 'rejected');
            }

            displayRequests(requests);
        } else {
            container.innerHTML = '<div class="alert alert-error">Failed to load requests</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="alert alert-error">Failed to connect to server. Make sure it\'s running.</div>';
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
                    <span class="detail-label">Student ID:</span>
                    <span class="detail-value">${request.studentId}</span>
                </div>
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
                ${request.approvedAt ? `
                    <div class="detail-row">
                        <span class="detail-label">Decision Date:</span>
                        <span class="detail-value">${new Date(request.approvedAt).toLocaleString()}</span>
                    </div>
                ` : ''}
            </div>

            ${request.status === 'pending' ? `
                <div class="request-actions">
                    <button class="btn btn-success" onclick="openModal('approve', '${request.id}')">
                        ✓ Approve
                    </button>
                    <button class="btn btn-danger" onclick="openModal('reject', '${request.id}')">
                        ✗ Reject
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');

    container.innerHTML = `<div class="requests-container">${html}</div>`;
}

// Open remarks modal
function openModal(action, requestId) {
    currentAction = action;
    currentRequestId = requestId;
    document.getElementById('remarksInput').value = '';
    document.getElementById('remarksModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('remarksModal').style.display = 'none';
    currentAction = null;
    currentRequestId = null;
}

// Submit decision
async function submitDecision() {
    const remarks = document.getElementById('remarksInput').value.trim();

    if (!remarks) {
        showAlert('Please enter remarks', 'error');
        return;
    }

    try {
        const url = `${API_URL}/requests/${currentRequestId}/${currentAction}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ moderatorRemarks: remarks })
        });

        const result = await response.json();

        if (result.success) {
            showAlert(`Request ${currentAction}d successfully!`, 'success');
            closeModal();
            loadRequests('pending'); // Reload pending requests
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to process request', 'error');
    }
}

// Auto-load pending requests on page load
document.addEventListener('DOMContentLoaded', () => {
    loadRequests('pending');
});