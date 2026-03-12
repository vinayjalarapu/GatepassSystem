const API_URL = 'http://localhost:3000/api';

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

// Verify pass
async function verifyPass() {
    const passId = document.getElementById('passId').value.trim();

    if (!passId) {
        showAlert('Please enter a Pass ID', 'error');
        return;
    }

    const resultContainer = document.getElementById('verificationResult');
    resultContainer.innerHTML = '<div class="loading">Verifying pass...</div>';

    try {
        const response = await fetch(`${API_URL}/verify/${passId}`);
        const result = await response.json();

        if (result.success) {
            displayValidPass(result.data);
        } else {
            displayInvalidPass(result.message, result.data);
        }
    } catch (error) {
        console.error('Error:', error);
        resultContainer.innerHTML = `
            <div class="verification-result verification-error">
                <h3>❌ Connection Error</h3>
                <p>Failed to connect to server. Please make sure the server is running.</p>
            </div>
        `;
    }
}

// Display valid pass
function displayValidPass(request) {
    const resultContainer = document.getElementById('verificationResult');
    
    resultContainer.innerHTML = `
        <div class="verification-result verification-success">
            <h3>✅ Pass is Valid</h3>
            
            <div class="request-details" style="margin: 20px 0; text-align: left;">
                <div class="detail-row">
                    <span class="detail-label">Pass ID:</span>
                    <span class="detail-value">${request.id}</span>
                </div>
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
                    <span class="detail-label">Approved At:</span>
                    <span class="detail-value">${new Date(request.approvedAt).toLocaleString()}</span>
                </div>
                ${request.moderatorRemarks ? `
                    <div class="detail-row">
                        <span class="detail-label">Moderator Remarks:</span>
                        <span class="detail-value">${request.moderatorRemarks}</span>
                    </div>
                ` : ''}
            </div>

            <button onclick="markAsUsed('${request.id}')" class="btn btn-success" style="font-size: 1.1rem; padding: 15px 40px;">
                Mark as Used & Allow Exit
            </button>
        </div>
    `;
}

// Display invalid pass
function displayInvalidPass(message, request = null) {
    const resultContainer = document.getElementById('verificationResult');
    
    let detailsHtml = '';
    if (request) {
        detailsHtml = `
            <div class="request-details" style="margin: 20px 0; text-align: left;">
                <div class="detail-row">
                    <span class="detail-label">Pass ID:</span>
                    <span class="detail-value">${request.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Student Name:</span>
                    <span class="detail-value">${request.studentName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value status-badge status-${request.status}">${request.status}</span>
                </div>
                ${request.moderatorRemarks ? `
                    <div class="detail-row">
                        <span class="detail-label">Remarks:</span>
                        <span class="detail-value">${request.moderatorRemarks}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    resultContainer.innerHTML = `
        <div class="verification-result verification-error">
            <h3>❌ ${message}</h3>
            ${detailsHtml}
            <p style="margin-top: 20px; font-weight: 500;">DO NOT ALLOW EXIT</p>
        </div>
    `;
}

// Mark pass as used
async function markAsUsed(passId) {
    try {
        const response = await fetch(`${API_URL}/verify/${passId}/use`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Pass marked as used. Student may exit.', 'success');
            
            // Update display
            document.getElementById('verificationResult').innerHTML = `
                <div class="verification-result verification-success">
                    <h3>✅ Exit Allowed</h3>
                    <p style="font-size: 1.2rem; margin: 20px 0;">Pass has been marked as used</p>
                    <p style="color: #666;">Student: <strong>${result.data.studentName}</strong></p>
                    <p style="color: #666;">Pass ID: ${result.data.id}</p>
                    <button onclick="resetForm()" class="btn btn-primary" style="margin-top: 20px;">
                        Verify Another Pass
                    </button>
                </div>
            `;
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to mark pass as used', 'error');
    }
}

// Reset form
function resetForm() {
    document.getElementById('passId').value = '';
    document.getElementById('verificationResult').innerHTML = '';
}

// Allow Enter key to verify
document.getElementById('passId').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        verifyPass();
    }
});