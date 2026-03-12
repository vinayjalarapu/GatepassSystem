const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database file path
const DB_PATH = path.join(__dirname, 'data', 'database.json');

// Helper function to read database
async function readDatabase() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    throw error;
  }
}

// Helper function to write database
async function writeDatabase(data) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
}

// Generate unique request ID
function generateRequestId() {
  return 'REQ' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// ============================================
// STUDENT ENDPOINTS
// ============================================

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const db = await readDatabase();
    res.json({ success: true, data: db.students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Submit gate pass request
app.post('/api/requests', async (req, res) => {
  try {
    const { studentId, studentName, reason, exitDate, exitTime, returnDate, returnTime } = req.body;
    
    if (!studentId || !studentName || !reason || !exitDate || !exitTime) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const db = await readDatabase();
    
    const newRequest = {
      id: generateRequestId(),
      studentId,
      studentName,
      reason,
      exitDate,
      exitTime,
      returnDate: returnDate || '',
      returnTime: returnTime || '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      moderatorRemarks: '',
      approvedAt: null,
      qrCode: ''
    };

    db.requests.push(newRequest);
    await writeDatabase(db);

    res.json({ success: true, message: 'Request submitted successfully', data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get student's requests
app.get('/api/requests/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const db = await readDatabase();
    
    const studentRequests = db.requests.filter(req => req.studentId === studentId);
    res.json({ success: true, data: studentRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// MODERATOR ENDPOINTS
// ============================================

// Get all pending requests
app.get('/api/requests/pending', async (req, res) => {
  try {
    const db = await readDatabase();
    const pendingRequests = db.requests.filter(req => req.status === 'pending');
    res.json({ success: true, data: pendingRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all requests (for moderator to see history)
app.get('/api/requests', async (req, res) => {
  try {
    const db = await readDatabase();
    res.json({ success: true, data: db.requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve request
app.post('/api/requests/:requestId/approve', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { moderatorRemarks } = req.body;
    
    const db = await readDatabase();
    const requestIndex = db.requests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(requestId);
    
    db.requests[requestIndex].status = 'approved';
    db.requests[requestIndex].moderatorRemarks = moderatorRemarks || 'Approved';
    db.requests[requestIndex].approvedAt = new Date().toISOString();
    db.requests[requestIndex].qrCode = qrCodeData;

    await writeDatabase(db);

    res.json({ success: true, message: 'Request approved', data: db.requests[requestIndex] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reject request
app.post('/api/requests/:requestId/reject', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { moderatorRemarks } = req.body;
    
    const db = await readDatabase();
    const requestIndex = db.requests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    db.requests[requestIndex].status = 'rejected';
    db.requests[requestIndex].moderatorRemarks = moderatorRemarks || 'Rejected';
    db.requests[requestIndex].approvedAt = new Date().toISOString();

    await writeDatabase(db);

    res.json({ success: true, message: 'Request rejected', data: db.requests[requestIndex] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// GATEKEEPER ENDPOINTS
// ============================================

// Verify pass by ID
app.get('/api/verify/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const db = await readDatabase();
    
    const request = db.requests.find(req => req.id === requestId);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    if (request.status !== 'approved') {
      return res.json({ success: false, message: 'Pass is not approved', data: request });
    }

    // Check if already used
    const isUsed = db.usedPasses.includes(requestId);
    if (isUsed) {
      return res.json({ success: false, message: 'Pass already used', data: request });
    }

    res.json({ success: true, message: 'Pass is valid', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark pass as used
app.post('/api/verify/:requestId/use', async (req, res) => {
  try {
    const { requestId } = req.params;
    const db = await readDatabase();
    
    const request = db.requests.find(req => req.id === requestId);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Pass is not approved' });
    }

    // Check if already used
    if (db.usedPasses.includes(requestId)) {
      return res.status(400).json({ success: false, message: 'Pass already used' });
    }

    db.usedPasses.push(requestId);
    await writeDatabase(db);

    res.json({ success: true, message: 'Pass marked as used', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   Student: POST /api/requests - Submit request`);
  console.log(`   Student: GET /api/requests/student/:studentId - Get student requests`);
  console.log(`   Moderator: GET /api/requests/pending - Get pending requests`);
  console.log(`   Moderator: POST /api/requests/:id/approve - Approve request`);
  console.log(`   Moderator: POST /api/requests/:id/reject - Reject request`);
  console.log(`   Gatekeeper: GET /api/verify/:id - Verify pass`);
  console.log(`   Gatekeeper: POST /api/verify/:id/use - Mark pass as used`);
});