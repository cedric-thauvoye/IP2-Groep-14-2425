const express = require('express');
const cors = require('cors');
const { admin, auth, verifyToken } = require('./middleware/getAdmin');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Get a list of all Authentication users
app.get('/users', verifyToken, async (req, res) => {
    try {
        const listUsers = await auth.listUsers();
        const users = listUsers.users.map((user) => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            provider: user.providerData.map((p) => p.providerId), // Example: ['google.com', 'microsoft.com']
            createdAt: user.metadata.creationTime
        }));

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific Authentication user by UID
app.get('/users/:uid', verifyToken, async (req, res) => {
    try {
        const user = await auth.getUser(req.params.uid);

        res.json({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            provider: user.providerData.map((p) => p.providerId),
            createdAt: user.metadata.creationTime
        });
    } catch (error) {
        res.status(404).json({ error: 'User not found' });
    }
});

// Get multiple Authentication users by UIDs
app.post('/users/batch', verifyToken, async (req, res) => {
    try {
        const { uids } = req.body;
        const users = await Promise.all(uids.map((uid) => auth.getUser(uid)));
        const userDetails = users.map((user) => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            provider: user.providerData.map((p) => p.providerId),
            createdAt: user.metadata.creationTime
        }));

        res.json(userDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
