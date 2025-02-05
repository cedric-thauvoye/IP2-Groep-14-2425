const admin = require('firebase-admin')

admin.initializeApp({
    credential: admin.credential.cert(require('../secret/firebase-admin-sdk.json')),
})

const auth = admin.auth()

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] // Extract Bearer token

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' })
    }

    try {
        const decodedToken = await auth.verifyIdToken(token)

        // Check if the email belongs to the Odisee organization
        if (!userEmail.endsWith('@student.odisee.be') && !userEmail.endsWith('@odisee.be')) {
            return res
                .status(403)
                .json({ error: 'Forbidden: User is not from the Organization "Odisee"' })
        }

        req.user = decodedToken // Attach user data to request
        next() // Allow request to proceed
    } catch (error) {
        return res.status(403).json({ error: 'Forbidden: Invalid token' })
    }
}

module.exports = {
    admin,
    auth,
    verifyToken,
}
