require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult, check } = require('express-validator');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 5000;

// Basic CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Essential middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ctf-platform')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Rate limiting for challenge creation
const createChallengeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3 // Limit each user to 3 challenge creations per window
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Helper Functions
const normalizeFlag = (flag) => flag.trim().toLowerCase();
const calculatePoints = (difficulty) => {
  const pointsMap = { easy: 100, medium: 200, hard: 300 };
  return pointsMap[difficulty] || 100;
};

// Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, default: '' },
  bio: { type: String, default: '' },
  todoChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  solvedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  points: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  points: { type: Number, required: true },
  flag: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  solves: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Challenge = mongoose.model('Challenge', ChallengeSchema);

// Routes
// Auth Routes
app.post('/api/register', [
  check('username').isLength({ min: 3 }),
  check('email').isEmail(),
  check('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { username, email, password } = req.body;
    
    if (await User.findOne({ $or: [{ email }, { username }] })) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10)
    });

    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/login', [
  check('username').notEmpty(),
  check('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        points: user.points
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

// Password Reset Routes
app.post('/api/forgot-password', [
  check('email').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ 
      resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process request' });
  }
});

app.post('/api/reset-password', [
  check('token').notEmpty(),
  check('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ message: 'Invalid token' });

    user.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();
    res.status(200).json({ message: 'Password updated' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Profile Routes
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('solvedChallenges', 'title points difficulty');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const rank = await User.countDocuments({ points: { $gt: user.points } }) + 1;
    res.status(200).json({ ...user._doc, rank });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

app.put('/api/profile', authenticateToken, [
  check('displayName').optional().isLength({ max: 50 }),
  check('bio').optional().isLength({ max: 200 }),
  check('email').optional().isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, ...updateData } = req.body;
    if (email && await User.findOne({ email, _id: { $ne: req.user.id } })) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { ...updateData, ...(email && { email }) },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

app.put('/api/profile/password', authenticateToken, [
  check('currentPassword').notEmpty(),
  check('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.user.id);
    if (!(await bcrypt.compare(req.body.currentPassword, user.password))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();
    res.status(200).json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// Challenge Routes
app.post('/api/challenges', createChallengeLimiter, authenticateToken, [
  check('title').isLength({ min: 5 }),
  check('description').isLength({ min: 20 }),
  check('category').notEmpty(),
  check('difficulty').isIn(['easy', 'medium', 'hard']),
  check('flag').isLength({ min: 3 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const challenge = new Challenge({
      ...req.body,
      points: calculatePoints(req.body.difficulty),
      author: req.user.id
    });

    await challenge.save();
    res.status(201).json(challenge);
  } catch (err) {
    res.status(500).json({ message: 'Challenge creation failed' });
  }
});

app.get('/api/challenges', async (req, res) => {
  try {
    const challenges = await Challenge.find()
      .select('-flag')
      .populate('author', 'username');
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch challenges' });
  }
});

app.get('/api/challenges/difficulty/:level', async (req, res) => {
  try {
    if (!['easy', 'medium', 'hard'].includes(req.params.level)) {
      return res.status(400).json({ message: 'Invalid difficulty' });
    }
    const challenges = await Challenge.find({ difficulty: req.params.level })
      .select('-flag')
      .populate('author', 'username');
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch challenges' });
  }
});

app.post('/api/challenges/:id/submit', authenticateToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Prevent users from solving their own challenges
    if (challenge.author.equals(req.user.id)) {
      return res.status(400).json({ message: 'You cannot solve your own challenge' });
    }

    if (req.body.flag?.trim().toLowerCase() === challenge.flag.toLowerCase()) {
      const user = await User.findById(req.user.id);
      
      if (!user.solvedChallenges.includes(req.params.id)) {
        user.solvedChallenges.push(req.params.id);
        user.points += challenge.points;
        await user.save();
        
        challenge.solves += 1;
        await challenge.save();
      }
      
      return res.json({ 
        success: true,
        message: 'Flag correct!', 
        points: challenge.points 
      });
    }
    
    return res.status(400).json({ message: 'Incorrect flag' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Todo List Routes
app.get('/api/user/todo', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('todoChallenges', 'title category difficulty points');
    res.json(user.todoChallenges || []);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch todo list' });
  }
});

app.post('/api/user/todo', authenticateToken, async (req, res) => {
  try {
    const { challengeId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { todoChallenges: challengeId } },
      { new: true }
    ).populate('todoChallenges', 'title category difficulty points');
    
    res.json(user.todoChallenges);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add to todo list' });
  }
});

app.delete('/api/user/todo/:challengeId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { todoChallenges: req.params.challengeId } },
      { new: true }
    ).populate('todoChallenges', 'title category difficulty points');
    
    res.json(user.todoChallenges);
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove from todo list' });
  }
});

// Leaderboard Routes
app.get('/api/user/rank', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const rank = await User.countDocuments({ points: { $gt: user.points } }) + 1;
    res.json({ ...user.toObject(), rank });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find()
      .sort({ points: -1 })
      .limit(50)
      .select('username points solvedChallenges createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/user/solved-challenges', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('solvedChallenges', 'title category difficulty points createdAt');
    res.json(user.solvedChallenges || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));