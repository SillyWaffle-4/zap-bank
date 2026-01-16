const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const User = require('./User'); // Ensure User.js is in the same folder

dotenv.config();
const app = express();
app.use(express.json());

// Serve static admin/user pages
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Zap Bank is OPEN on Mac!"))
    .catch((err) => console.error("❌ DB Connection Error:", err));

// --- ROUTES ---

// 1. Register a new user
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({ 
            username: username, 
            password: hashedPassword 
        });
        
        await newUser.save();
        res.status(201).send("Account created successfully!");
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

// 2. Admin Donation Route (The "Banker" Route)
// Admin donate now uses admin JWT for protection
const adminAuth = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).send('Missing admin token');
    const token = auth.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.ADMIN_SECRET_KEY);
        if (!payload || !payload.admin) return res.status(403).send('Forbidden');
        next();
    } catch (err) {
        return res.status(401).send('Invalid admin token');
    }
};

app.post('/admin/donate', adminAuth, async (req, res) => {
    const { username, amount } = req.body;
    if (!username || typeof amount !== 'number') return res.status(400).send('username and numeric amount required');
    try {
        const user = await User.donate(username, amount);
        if (!user) return res.status(404).send('User not found.');
        res.send(`Success! ${username} now has ${user.zaps} Zaps.`);
    } catch (err) {
        res.status(500).send('Error adding Zaps: ' + err.message);
    }
});

// Admin login to obtain admin token (use your ADMIN_SECRET_KEY)
app.post('/admin/login', (req, res) => {
    const { adminKey } = req.body;
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) return res.status(403).send('Unauthorized');
    const token = jwt.sign({ admin: true }, process.env.ADMIN_JWT_SECRET || process.env.ADMIN_SECRET_KEY, { expiresIn: '2h' });
    res.json({ token });
});

// Admin: list all users (username + zaps)
app.get('/admin/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find({}).select('username zaps -_id').lean();
        res.json(users);
    } catch (err) {
        res.status(500).send('Error fetching users: ' + err.message);
    }
});

// User login to receive JWT
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        // If user does not exist, create account automatically
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ username, password: hashedPassword });
            await newUser.save();
            const token = jwt.sign({ id: newUser._id, username: newUser.username }, process.env.JWT_SECRET, { expiresIn: '8h' });
            return res.status(201).json({ token, created: true, message: 'Account created and logged in' });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).send('Invalid credentials');
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, created: false });
    } catch (err) {
        res.status(500).send('Login error: ' + err.message);
    }
});

// User auth middleware
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send('Missing token');
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        res.status(401).send('Invalid token');
    }
};

// Return current user data
app.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('username zaps');
        if (!user) return res.status(404).send('User not found');
        res.json(user);
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server spinning on port ${PORT}`));