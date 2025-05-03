// routes.js
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const OpenAI = require('openai');
const {
  authenticateToken,
  uploadAvatar,
  validateImageType,
  validateChallengeSubmission,
  validateChallenge,
  normalizeFlag,
  getPredefinedResponse,
  getGeneralCTFAdvice,
  calculatePoints,
  limiter,
  chatLimiter,
  chatRateLimiter,
  createChallengeLimiter,
  submitLimiter,
  validateDiscussionId,
  validateCommentId,
  validateDiscussion,
  validateComment,
  validateVote,
  validateSolution
} = require('./middleware');
const { User, Challenge, Discussion, Comment } = require('./models');

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 20;

let openai;
if (process.env.NODE_ENV !== 'test') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  openai = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "Test hint" } }]
        })
      }
    }
  };
}

// Helper functions

async function generateAIHint(challenge) {
  try {
    const challengeDetails = `Title: ${challenge.title}\n` +
                            `Category: ${challenge.category}\n` +
                            `Description: ${challenge.description.substring(0, 200)}...`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `Provide a subtle hint (not the solution) for this CTF challenge. ` +
                 `The hint should help the user think in the right direction without giving away ` +
                 `the solution. Challenge details:\n${challengeDetails}`
      }],
      temperature: 0.6,
      max_tokens: 100
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Hint generation failed:", error);
    const fallbackHints = {
      'web': 'Check the HTTP headers and page source carefully',
      'crypto': 'Look for patterns in the encrypted data',
      'forensics': 'The file might contain hidden data',
      'pwn': 'Check for buffer overflow possibilities',
      'reversing': 'Try decompiling the binary',
      'misc': 'Think outside the box'
    };
    return fallbackHints[challenge.category] || 
           "Try examining all aspects of the challenge carefully.";
  }
}
function buildHelpMessage(user) {
  let message = "I can help with:\n";
  message += "1) /hint - Get challenge-specific hints (costs points)\n";
  message += "2) /tips - Get general CTF tips\n";
  message += "3) /advice - Get strategic advice\n\n";
  message += `You currently have ${user.points} points available.\n`;
  message += "Type any of these commands followed by your question.";
  return message;
}

function getGeneralCTFTips() {
  const tips = [
    "🔍 Always check page source (Ctrl+U) and network requests",
    "🧩 Look for patterns in encoded/encrypted data",
    "📁 Check for hidden files/directories (.git, /backup)",
    "🔑 Try common credentials (admin:admin, guest:guest)",
    "📝 Read challenge descriptions carefully - clues are often there",
    "🧰 Use appropriate tools (Burp, Wireshark, binwalk, etc.)"
  ];
  return `GENERAL CTF TIPS:\n${tips.map(t => `• ${t}`).join('\n')}`;
}

function getCTFStrategyAdvice() {
  const strategies = [
    "🕒 Time management: Don't get stuck on one challenge too long",
    "📊 Prioritize: Solve easier challenges first to build points",
    "👥 Collaborate: Discuss with teammates (without sharing flags)",
    "📚 Research: Google error messages and techniques",
    "🧠 Think outside the box: Solutions are often unconventional",
    "🔄 Take breaks: Fresh eyes spot things you might have missed"
  ];
  return `CTF STRATEGY ADVICE:\n${strategies.map(s => `• ${s}`).join('\n')}`;
}

// Auth Routes
router.post('/api/register', [
  check('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .trim()
    .escape(),
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase, one lowercase, one number and one special character')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => ({
        param: err.param,
        message: err.msg
      }))
    });
  }

  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    }).select('username email').lean();

    if (existingUser) {
      const errors = [];
      if (existingUser.username === username) {
        errors.push({ param: 'username', message: 'Username is already taken' });
      }
      if (existingUser.email === email) {
        errors.push({ param: 'email', message: 'Email is already registered' });
      }
      return res.status(409).json({ 
        success: false,
        errors 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword 
    });

    await user.save();
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed. Please try again later.' 
    });
  }
});
router.post('/api/login', [
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

router.post('/api/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

// Password Reset Routes
router.post('/api/forgot-password', [
  check('email').isEmail().normalizeEmail(),
], async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 500));
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

router.post('/api/reset-password', [
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
router.post('/api/user/avatar', 
  authenticateToken,
  uploadAvatar.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Process image with sharp
      const processedAvatar = `processed-${req.file.filename}`;
      await sharp(req.file.path)
        .resize(256, 256)
        .toFormat('webp')
        .toFile(`uploads/avatars/${processedAvatar}`);

      // Delete original
      fs.unlinkSync(req.file.path);

      // Update user
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { avatar: processedAvatar },
        { new: true }
      );

      res.json({ 
        avatarUrl: `/avatars/${processedAvatar}` 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Avatar upload failed' });
    }
  }
);

router.delete('/api/user/avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.avatar !== 'default-avatar.png') {
      const avatarPath = path.join('uploads/avatars', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    user.avatar = 'default-avatar.png';
    await user.save();

    res.json({ message: 'Avatar reset to default' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset avatar' });
  }
});

router.get('/api/profile', authenticateToken, async (req, res) => {
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

router.put('/api/profile', authenticateToken, [
  check('displayName').optional().isLength({ max: 50 }),
  check('bio').optional().isLength({ max: 200 }),
  check('email').isEmail().normalizeEmail(),
  check('socialLinks.github').optional().isURL(),
  check('socialLinks.twitter').optional().isURL(),
  check('socialLinks.website').optional().isURL()
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

router.put('/api/profile/password', authenticateToken, [
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
router.post('/api/challenges', createChallengeLimiter, authenticateToken, [
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
      author: req.user.id,
      solves: 0
    });

    await challenge.save();
    
    // Add to user's created challenges
    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdChallenges: challenge._id }
    });

    res.status(201).json(challenge);
  } catch (err) {
    res.status(500).json({ message: 'Challenge creation failed' });
  }
});
router.get('/api/challenges', async (req, res) => {
  try {
    const challenges = await Challenge.find()
      .select('-flag')
      .populate('author', 'username');
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch challenges' });
  }
});

router.get('/api/challenges/difficulty/:level', async (req, res) => {
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

router.post('/api/challenges/:id/submit', 
  authenticateToken,
  submitLimiter,
  validateChallengeSubmission,
  validateChallenge,
  async (req, res) => {
    try {
      const challenge = await Challenge.findById(req.params.id);
      const user = await User.findById(req.user.id);

      // Block self-solving
      if (challenge.author.equals(user._id)) {
        return res.status(403).json({
          error: 'SELF_SOLVE_BLOCKED',
          message: "You can't solve your own challenge!"
        });
      }

      // Rest of your submission logic...
      if (normalizeFlag(req.body.flag) !== normalizeFlag(challenge.flag)) {
        return res.status(400).json({
          error: 'INCORRECT_FLAG',
          message: 'Incorrect flag submitted'
        });
      }

      // Check if already solved
      if (user.solvedChallenges.includes(challenge._id)) {
        return res.json({
          success: true,
          message: 'Already solved!',
          points: 0
        });
      }

      // Update user and challenge
      user.solvedChallenges.push(challenge._id);
      user.points += challenge.points;
      await user.save();

      challenge.solves += 1;
      await challenge.save();

      return res.json({
        success: true,
        message: 'Flag correct! Challenge solved!',
        points: challenge.points
      });

    } catch (err) {
      console.error('Submission Error:', err);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      });
    }
  }
);
// Get hints for a challenge
router.get('/api/challenges/:id/hints', authenticateToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    
    // Only return basic hint info without revealing content
    const hints = challenge.hints.map(hint => ({
      id: hint._id,
      cost: hint.cost,
      isUnlocked: false
    }));
    
    res.json(hints);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch hints' });
  }
});

router.post('/api/challenges/:id/use-hint', authenticateToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!challenge || !user) {
      return res.status(404).json({ message: 'Challenge or user not found' });
    }

    const hint = challenge.hints.find(h => 
      h._id.equals(req.body.hintId) || h.text === req.body.hintId
    );

    if (!hint) {
      return res.status(404).json({ message: 'Hint not found' });
    }

    if (user.points < hint.cost) {
      return res.status(400).json({ 
        message: `You need ${hint.cost - user.points} more points` 
      });
    }

    user.points -= hint.cost;
    await user.save();

    res.json({ 
      success: true,
      hint: hint.text,
      pointsDeducted: hint.cost,
      remainingPoints: user.points
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to use hint' });
  }
});

// Chat Routes
router.post('/api/chat', chatLimiter, authenticateToken, async (req, res) => {
  try {
    const { message, challengeId } = req.body;
    const user = await User.findById(req.user.id);
    const lowerMsg = message.toLowerCase().trim();

    // 1. Enhanced predefined responses
    const predefined = getPredefinedResponse(lowerMsg);
    if (predefined) {
      return res.json({ 
        response: predefined, 
        type: 'predefined',
        requiresChallenge: false 
      });
    }

    // 2. Command routing
    const command = lowerMsg.split(' ')[0];
    const isHintRequest = command === '/hint' || lowerMsg.includes('hint');
    const isTipsRequest = command === '/tips' || command === '/tip' || lowerMsg.includes('tips');
    const isAdviceRequest = command === '/advice' || lowerMsg.includes('advice');
    const isHelpRequest = command === '/help' || lowerMsg.includes('help');

    // 3. Handle hint requests (requires challenge)
    if (isHintRequest) {
      if (!challengeId) {
        return res.json({
          response: "Please open a challenge first before asking for hints.",
          type: 'error',
          requiresChallenge: true
        });
      }

      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        return res.status(404).json({ 
          error: 'CHALLENGE_NOT_FOUND',
          message: 'Challenge not found' 
        });
      }

      // Check if user already solved this challenge
      if (user.solvedChallenges.includes(challengeId)) {
        return res.json({
          response: "You've already solved this challenge! Try another one.",
          type: 'already_solved'
        });
      }

      // Handle manual hints if available
      if (challenge.hints?.length > 0) {
        const affordableHints = challenge.hints
          .filter(h => h.cost <= user.points)
          .sort((a, b) => a.cost - b.cost);

        if (affordableHints.length === 0) {
          return res.json({
            response: `You need at least ${Math.min(...challenge.hints.map(h => h.cost))} points for a hint`,
            type: 'point_requirement'
          });
        }

        // Select most affordable hint
        const selectedHint = affordableHints[0];
        user.points -= selectedHint.cost;
        await user.save();

        return res.json({
          response: `HINT (${selectedHint.cost} points): ${selectedHint.text}`,
          type: 'hint',
          pointsDeducted: selectedHint.cost
        });
      }

      // Fallback to AI hint
      const hintCost = challenge.hintCost || 50;
      if (user.points < hintCost) {
        return res.json({
          response: `You need ${hintCost - user.points} more points for a hint`,
          type: 'point_requirement'
        });
      }

      const hint = await generateAIHint(challenge);
      user.points -= hintCost;
      await user.save();

      return res.json({
        response: `AI HINT (${hintCost} points): ${hint}`,
        type: 'hint',
        pointsDeducted: hintCost
      });
    }

    // 4. Handle tips/advice requests (no challenge needed)
    if (isTipsRequest || isAdviceRequest) {
      const adviceType = isTipsRequest ? 'tip' : 'advice';
      const response = isTipsRequest 
        ? getGeneralCTFTips() 
        : getCTFStrategyAdvice();

      return res.json({
        response,
        type: adviceType,
        requiresChallenge: false
      });
    }

    // 5. Handle help requests
    if (isHelpRequest) {
      return res.json({
        response: buildHelpMessage(user),
        type: 'help',
        requiresChallenge: false
      });
    }

    // 6. Fallback to general response
    return res.json({
      response: "I didn't understand that. Try asking for '/help' to see what I can do.",
      type: 'unknown',
      requiresChallenge: false
    });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      error: 'SERVER_ERROR',
      message: 'Failed to process chat request',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Todo List Routes
router.get('/api/user/todo', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('todoChallenges', 'title category difficulty points');
    res.json(user.todoChallenges || []);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch todo list' });
  }
});

router.post('/api/user/todo', authenticateToken, async (req, res) => {
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

router.delete('/api/user/todo/:challengeId', authenticateToken, async (req, res) => {
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
router.get('/api/leaderboard', async (req, res) => {
  try {
    // Fetch top users sorted by points (descending)
    const users = await User.find()
      .sort({ points: -1 })
      .limit(50)
      .select('username points solvedChallenges createdAt');
    
    // Get the current user's ID from auth token if available
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let currentUserId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.id;
      } catch (err) {
        // Invalid token, continue without current user context
      }
    }
    
    // If we have the current user and they're not in the top 50,
    // fetch their rank separately and possibly add them to the results
    let currentUserAdded = false;
    if (currentUserId) {
      const currentUserInList = users.some(user => 
        user._id.toString() === currentUserId.toString()
      );
      
      if (!currentUserInList) {
        const currentUser = await User.findById(currentUserId)
          .select('username points solvedChallenges createdAt');
          
        if (currentUser) {
          // Calculate the current user's rank
          const rank = await User.countDocuments({ points: { $gt: currentUser.points } }) + 1;
          
          // Add the current user to the results with their rank
          users.push({
            ...currentUser.toObject(),
            rank
          });
          currentUserAdded = true;
        }
      }
    }
    
    // Map to ensure we have the data needed by the frontend
    const enrichedUsers = users.map((user, index) => {
      const rank = index + 1;
      return {
        ...user.toObject(),
        rank,
        // Calculate security clearance level as done in frontend
        clearanceLevel: user.points ? Math.min(10, Math.floor(user.points/100) + 1) : 1
      }
    });
    
    res.json(enrichedUsers);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch leaderboard data',
      error: err.message 
    });
  }
});

// User ranking endpoint
router.get('/api/user/rank', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ 
      error: 'USER_NOT_FOUND',
      message: 'User not found' 
    });

    const rank = await User.countDocuments({ points: { $gt: user.points } }) + 1;
    const clearanceLevel = user.points ? Math.min(10, Math.floor(user.points/100) + 1) : 1;
    
    res.json({ 
      ...user.toObject(), 
      rank,
      clearanceLevel
    });
  } catch (err) {
    console.error('User rank error:', err);
    res.status(500).json({ 
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve user rank'
    });
  }
});

router.get('/api/user/solved-challenges', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('solvedChallenges', 'title category difficulty points createdAt');
    res.json(user.solvedChallenges || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/api/test-register', async (req, res) => {
  const user = new User({
    username: "testuser",
    email: "test@example.com",
    password: await bcrypt.hash("test123", 10)
  });
  await user.save();
  res.json({ success: true });
});

const formatResponse = (data, pagination = null) => {
  return {
    success: true,
    data,
    ...(pagination && { pagination })
  };
};

const formatError = (error, message, details = null) => {
  return {
    success: false,
    error,
    message,
    ...(details && { details })
  };
};

router.post('/api/discussions', authenticateToken, validateDiscussion, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(
      formatError(
        'VALIDATION_ERROR',
        'Validation failed',
        errors.array()
      )
    );
  }

  try {
    const tags = (req.body.tags || [])
      .map(tag => tag.trim().toLowerCase())
      .filter((tag, index, arr) => tag && arr.indexOf(tag) === index)
      .slice(0, MAX_TAGS);

    const discussion = new Discussion({
      title: req.body.title,
      content: req.body.content,
      author: req.user.id,
      tags
    });

    const savedDiscussion = await discussion.save();
    const populatedDiscussion = await Discussion.findById(savedDiscussion._id)
      .populate('author', 'username displayName avatar createdAt');

    res.status(201).json(
      formatResponse(populatedDiscussion.toObject())
    );
  } catch (err) {
    console.error('Discussion creation error:', err);
    res.status(500).json(
      formatError(
        'SERVER_ERROR',
        'Failed to create discussion',
        process.env.NODE_ENV === 'development' ? err.message : undefined
      )
    );
  }
});
router.get('/api/discussions', async (req, res) => {
  try {
    // Parse and validate query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(
      parseInt(req.query.limit) || DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );
    const sort = req.query.sort || '-createdAt';
    const search = req.query.search || '';
    const tag = req.query.tag || '';
    const author = req.query.author || '';

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }
    
    if (author) {
      if (mongoose.Types.ObjectId.isValid(author)) {
        query.author = author;
      } else {
        // If author is not an ID, try to find by username
        const user = await User.findOne({ username: author });
        if (user) {
          query.author = user._id;
        } else {
          return res.json(formatResponse([], {
            totalItems: 0,
            totalPages: 0,
            currentPage: page,
            itemsPerPage: limit
          }));
        }
      }
    }

    // Execute queries in parallel
    const [discussions, count] = await Promise.all([
      Discussion.find(query)
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('author', 'username displayName avatar createdAt')
        .populate({
          path: 'comments',
          options: { limit: 3 },
          populate: { path: 'author', select: 'username displayName avatar' }
        })
        .lean(),
      Discussion.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    res.json(
      formatResponse(discussions, {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      })
    );
  } catch (err) {
    console.error('Fetch discussions error:', err);
    res.status(500).json(
      formatError(
        'SERVER_ERROR',
        'Failed to fetch discussions',
        process.env.NODE_ENV === 'development' ? err.message : undefined
      )
    );
  }
});
router.get('/api/discussions/:id', validateDiscussionId, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('author', 'username displayName avatar createdAt')
      .populate({
        path: 'comments',
        populate: [
          { 
            path: 'author', 
            select: 'username displayName avatar createdAt' 
          },
          { 
            path: 'parentComment',
            populate: { 
              path: 'author', 
              select: 'username displayName avatar' 
            } 
          }
        ],
        options: { sort: { createdAt: -1 } }
      });

    if (!discussion) {
      return res.status(404).json(
        formatError('NOT_FOUND', 'Discussion not found')
      );
    }

    res.json(formatResponse(discussion));
  } catch (err) {
    console.error('Fetch discussion error:', err);
    res.status(500).json(
      formatError(
        'SERVER_ERROR',
        'Failed to fetch discussion',
        process.env.NODE_ENV === 'development' ? err.message : undefined
      )
    );
  }
});
// Get popular tags
router.get('/api/discussions/tags/popular', async (req, res) => {
  try {
    const tags = await Discussion.aggregate([
      { $unwind: '$tags' },
      { $group: { 
        _id: '$tags', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json(
      formatResponse(
        tags.map(tag => ({
          name: tag._id,
          count: tag.count
        }))
      )
    );
  } catch (err) {
    console.error('Popular tags error:', err);
    res.status(500).json(
      formatError(
        'SERVER_ERROR',
        'Failed to fetch popular tags',
        process.env.NODE_ENV === 'development' ? err.message : undefined
      )
    );
  }
});
const handleVote = async (req, res, model) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(
      formatError(
        'VALIDATION_ERROR',
        'Validation failed',
        errors.array()
      )
    );
  }

  try {
    const item = await model.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json(
        formatError(
          'NOT_FOUND',
          `${model.modelName} not found`
        )
      );
    }

    const userId = req.user.id;
    let update = {};

    if (req.body.type === 'upvote') {
      if (item.upvotes.includes(userId)) {
        update = { $pull: { upvotes: userId } };
      } else {
        update = { 
          $addToSet: { upvotes: userId },
          $pull: { downvotes: userId }
        };
      }
    } else if (req.body.type === 'downvote') {
      if (item.downvotes.includes(userId)) {
        update = { $pull: { downvotes: userId } };
      } else {
        update = { 
          $addToSet: { downvotes: userId },
          $pull: { upvotes: userId }
        };
      }
    } else if (req.body.type === 'remove') {
      update = {
        $pull: { 
          upvotes: userId,
          downvotes: userId 
        }
      };
    }

    const updatedItem = await model.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    res.json(
      formatResponse({
        upvotes: updatedItem.upvotes.length,
        downvotes: updatedItem.downvotes.length,
        score: updatedItem.upvotes.length - updatedItem.downvotes.length
      })
    );
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json(
      formatError(
        'SERVER_ERROR',
        `Failed to process vote on ${model.modelName}`,
        process.env.NODE_ENV === 'development' ? err.message : undefined
      )
    );
  }
};
router.post(
  '/api/discussions/:id/comments',
  authenticateToken,
  validateDiscussionId,
  validateComment,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array()
      });
    }

    try {
      // Verify discussion exists
      const discussion = await Discussion.findById(req.params.id);
      if (!discussion) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Discussion not found'
        });
      }

      // Verify parent comment exists if provided
      if (req.body.parentComment) {
        const parentComment = await Comment.findById(req.body.parentComment);
        if (!parentComment) {
          return res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: 'Parent comment not found'
          });
        }
      }

      // Create new comment
      const comment = new Comment({
        content: req.body.content,
        author: req.user.id,
        discussion: req.params.id,
        parentComment: req.body.parentComment || undefined
      });

      const savedComment = await comment.save();
      
      // Add comment to discussion
      await Discussion.findByIdAndUpdate(
        req.params.id,
        { $push: { comments: savedComment._id } },
        { new: true }
      );

      // Populate author info for the response
      const populatedComment = await Comment.findById(savedComment._id)
        .populate('author', 'username displayName avatar')
        .populate({
          path: 'parentComment',
          populate: {
            path: 'author',
            select: 'username displayName avatar'
          }
        });
      
      res.status(201).json({
        success: true,
        data: populatedComment
      });
    } catch (err) {
      console.error('Create comment error:', err);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to post comment',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);
router.post('/api/discussions/:id/vote', authenticateToken, validateDiscussionId, validateVote, 
  async (req, res) => handleVote(req, res, Discussion));

router.post('/api/comments/:id/vote', authenticateToken, validateCommentId, validateVote,
  async (req, res) => handleVote(req, res, Comment));

  router.post(
    '/api/discussions/:id/solution',
    authenticateToken,
    validateDiscussionId,
    validateSolution,
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        });
      }
  
      try {
        const discussion = await Discussion.findById(req.params.id);
        const comment = await Comment.findById(req.body.commentId);
        
        if (!discussion) {
          return res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: 'Discussion not found'
          });
        }
        
        if (!comment) {
          return res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: 'Comment not found'
          });
        }
        
        // Check if the user is the discussion author
        if (discussion.author.toString() !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'Only discussion author can mark solutions'
          });
        }
        
        // Check if comment belongs to this discussion
        if (comment.discussion.toString() !== discussion._id.toString()) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_REQUEST',
            message: 'Comment does not belong to this discussion'
          });
        }
        
        // Remove solution status from all other comments in this discussion
        await Comment.updateMany(
          { discussion: discussion._id },
          { $set: { isSolution: false } }
        );
        
        // Mark this comment as solution
        const updatedComment = await Comment.findByIdAndUpdate(
          comment._id,
          { $set: { isSolution: true } },
          { new: true }
        ).populate('author', 'username displayName avatar');
        
        res.json({
          success: true,
          data: updatedComment
        });
      } catch (err) {
        console.error('Mark solution error:', err);
        res.status(500).json({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Failed to mark solution',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    }
  );
module.exports = router;
