require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    money: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);
const questions = JSON.parse(fs.readFileSync('quoestions.json', 'utf-8'));

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});
app.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId); // Assume User is your Mongoose model
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            username: user.username,
            money: user.money
        });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching user data' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        //const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ user: { username: user.username, money: user.money, userId: user._id } });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
        console.log(err);
    }
});

app.get('/question', (req, res) => {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    res.json(randomQuestion);
});

app.post('/update-money', async (req, res) => {
    const { userId, amount } = req.body;
    try {
        const user = await User.findByIdAndUpdate(userId, { $inc: { money: amount } }, { new: true });
        res.json({ money: user.money });
    } catch (err) {
        res.status(500).json({ error: 'Could not update money' });
        console.log(err);
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
