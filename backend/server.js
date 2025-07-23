// Import necessary packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

// --- FINAL FIX --- Initialize Firebase Admin SDK for Deployment
let serviceAccount;

// Check if the secret is in a local file or in a base64 encoded environment variable
if (process.env.SERVICE_ACCOUNT_KEY_BASE64) {
  // On Render, decode the base64 string to get the JSON content
  const decodedKey = Buffer.from(process.env.SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8');
  serviceAccount = JSON.parse(decodedKey);
} else {
  // On your local machine, use the JSON file as before
  serviceAccount = require('./serviceAccountKey.json');
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();
// ------------------------------------

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes (No changes needed here) ---
// User Registration Route
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, role, name, batch } = req.body;
        if (role === 'student') {
            const studentRecord = await auth.createUser({ email, password });
            await auth.setCustomUserClaims(studentRecord.uid, { role: 'student' });
            const parentEmail = `parent.${email}`;
            const parentPassword = 'password123';
            const parentRecord = await auth.createUser({ email: parentEmail, password: parentPassword });
            await auth.setCustomUserClaims(parentRecord.uid, { role: 'parent' });
            await db.collection('users').doc(studentRecord.uid).set({
                name, email, role: 'student', batch, parentId: parentRecord.uid,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            await db.collection('users').doc(parentRecord.uid).set({
                name: `${name}'s Parent`, email: parentEmail, role: 'parent', studentId: studentRecord.uid,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            res.status(201).json({ message: `Successfully created student and linked parent account.` });
        } else {
            const userRecord = await auth.createUser({ email, password });
            await db.collection('users').doc(userRecord.uid).set({ email, role, name, batch: batch || null });
            await auth.setCustomUserClaims(userRecord.uid, { role: role });
            res.status(201).json({ message: `Successfully created new ${role}: ${email}` });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error creating new user', error: error.message });
    }
});

// Get Session Data Route
app.post('/api/get-session-data', async (req, res) => {
    try {
        const { idToken } = req.body;
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return res.status(404).json({ message: "User data not found." });
        const userData = userDoc.data();
        res.status(200).json({ user: { ...userData, uid } });
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized', error: error.message });
    }
});

// Get all students
app.get('/api/students', async (req, res) => {
    try {
        const snapshot = await db.collection('users').where('role', '==', 'student').get();
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

// Get all admins
app.get('/api/admins', async (req, res) => {
    try {
        const snapshot = await db.collection('users').where('role', '==', 'admin').get();
        const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admins', error: error.message });
    }
});

// Edit a student's details
app.put('/api/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { name, batch } = req.body;
        await db.collection('users').doc(studentId).update({ name, batch });
        res.status(200).json({ message: 'Student details updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating student', error: error.message });
    }
});

// Add a single academic record
app.post('/api/records/add', async (req, res) => {
    try {
        const { studentId, type, subject, score, date } = req.body;
        const record = { studentId, type, subject, score, date, createdAt: admin.firestore.FieldValue.serverTimestamp() };
        await db.collection('records').add(record);
        res.status(201).json({ message: `Record added successfully.` });
    } catch (error) {
        res.status(500).json({ message: 'Error adding record', error: error.message });
    }
});

// Send feedback to an entire batch
app.post('/api/feedback/batch', async (req, res) => {
    try {
        const { batch, message, date } = req.body;
        const studentsSnapshot = await db.collection('users').where('role', '==', 'student').where('batch', '==', batch).get();
        if (studentsSnapshot.empty) return res.status(404).json({ message: `No students found in batch ${batch}.` });
        
        const dbBatch = db.batch();
        studentsSnapshot.forEach(doc => {
            const studentId = doc.id;
            const newRecordRef = db.collection('records').doc();
            dbBatch.set(newRecordRef, {
                studentId, type: 'feedback', subject: 'Batch Feedback',
                score: message, date, createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await dbBatch.commit();
        res.status(201).json({ message: `Feedback sent to ${studentsSnapshot.size} students in batch ${batch}.` });
    } catch (error) {
        res.status(500).json({ message: 'Error sending batch feedback', error: error.message });
    }
});

// Mark chapter completion for an entire batch
app.post('/api/completion/batch', async (req, res) => {
    try {
        const { batch, subject, chapterName, date } = req.body;
        const studentsSnapshot = await db.collection('users').where('role', '==', 'student').where('batch', '==', batch).get();
        if (studentsSnapshot.empty) return res.status(404).json({ message: `No students found in batch ${batch}.` });
        
        const dbBatch = db.batch();
        studentsSnapshot.forEach(doc => {
            const studentId = doc.id;
            const newRecordRef = db.collection('records').doc();
            dbBatch.set(newRecordRef, {
                studentId, type: 'completion', subject,
                score: chapterName, date, createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await dbBatch.commit();
        res.status(201).json({ message: `Chapter completion marked for ${studentsSnapshot.size} students in batch ${batch}.` });
    } catch (error) {
        res.status(500).json({ message: 'Error marking batch completion', error: error.message });
    }
});

// Mark attendance for an entire batch
app.post('/api/attendance/batch', async (req, res) => {
    try {
        const { attendanceData, date } = req.body;
        const dbBatch = db.batch();
        
        for (const studentId in attendanceData) {
            const status = attendanceData[studentId];
            const newRecordRef = db.collection('records').doc();
            dbBatch.set(newRecordRef, {
                studentId, type: 'attendance', subject: 'N/A',
                score: status, date, createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        
        await dbBatch.commit();
        res.status(201).json({ message: `Attendance marked for ${Object.keys(attendanceData).length} students.` });
    } catch (error) {
        res.status(500).json({ message: 'Error marking batch attendance', error: error.message });
    }
});

// Get all records for a specific student
app.get('/api/records/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const snapshot = await db.collection('records').where('studentId', '==', studentId).get();
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching records', error: error.message });
    }
});

// Get dashboard stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
        const totalStudents = studentsSnapshot.size;

        const recentActivitySnapshot = await db.collection('records').orderBy('createdAt', 'desc').limit(5).get();
        const recentActivity = recentActivitySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

        res.status(200).json({ totalStudents, recentActivity });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
});

// Delete a student and their linked parent
app.delete('/api/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const studentDoc = await db.collection('users').doc(studentId).get();
        if (!studentDoc.exists) return res.status(404).json({ message: 'Student not found.' });

        const studentData = studentDoc.data();
        const parentId = studentData.parentId;
        
        await auth.deleteUser(studentId);
        if (parentId) await auth.deleteUser(parentId);
        
        await db.collection('users').doc(studentId).delete();
        if (parentId) await db.collection('users').doc(parentId).delete();
        
        res.status(200).json({ message: 'Student and linked parent deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting student', error: error.message });
    }
});

// Resource Hub Routes
app.post('/api/resources/add', async (req, res) => {
    try {
        const { batch, subject, chapterName, fileURL } = req.body;
        const resource = { batch, subject, chapterName, fileURL, createdAt: admin.firestore.FieldValue.serverTimestamp() };
        await db.collection('resources').add(resource);
        res.status(201).json({ message: 'Resource added successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding resource', error: error.message });
    }
});

app.get('/api/resources', async (req, res) => {
    try {
        const snapshot = await db.collection('resources').orderBy('createdAt', 'desc').get();
        const resources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(resources);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching resources', error: error.message });
    }
});

app.delete('/api/resources/:resourceId', async (req, res) => {
    try {
        const { resourceId } = req.params;
        await db.collection('resources').doc(resourceId).delete();
        res.status(200).json({ message: 'Resource deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting resource', error: error.message });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
