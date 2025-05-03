// middleware.js
const mongoose = require('mongoose'); 
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiters
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Too many chat requests, please try again later',
  keyGenerator: (req) => req.user?.id || req.ip
});

const chatRateLimiter = rateLimit({
  windowMs: 240 * 1000,
  max: 8,
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => req.user?.isPremium,
  handler: (req, res) => {
    const resetTime = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests. Please wait ${resetTime} seconds.`,
      retryAfter: resetTime,
      limit: req.rateLimit.limit,
      remaining: 0
    });
  }
});

const createChallengeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3
});

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many submissions, please try again later'
});

// Authentication middleware
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

// Image upload middleware
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const avatarFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};
function getPredefinedResponse(message) {
  const lowerMsg = message.toLowerCase();
  const responses = {
    'hello': 'Hello! How can I help you with your CTF challenges today?',
    'hi': 'Hi there! Need any hints or tips?',
    'help': 'I can help with:\n1. Challenge hints\n2. Flag verification\n3. General CTF tips',
    'bye': 'Goodbye! Happy hacking!',
    'thanks': "You're welcome! Let me know if you need more help."
  };
  return responses[lowerMsg] || null;
}
function getGeneralCTFAdvice() {
  const tips = [
    "Always read the challenge description carefully - the solution is often hinted there",
    "Check for hidden files or directories (try /robots.txt, .git/, .DS_Store)",
    "Look for comments in page source or network traffic - developers often leave clues",
    "Try different encoding schemes (base64, hex, URL encoding, etc.)",
    "For crypto challenges, analyze frequency patterns and common encryption methods",
    "Check for common vulnerabilities (XSS, SQLi, LFI/RFI, etc.)",
    "Don't overcomplicate - sometimes the solution is simpler than you think",
    "Use tools like Burp Suite or Wireshark for web challenges",
    "For forensics, try binwalk, strings, or hex editors to examine files",
    "When stuck, take a break and come back with fresh eyes"
  ];
  
  const randomTips = [];
  for (let i = 0; i < 3; i++) {
    randomTips.push(tips[Math.floor(Math.random() * tips.length)]);
  }
  
  return `GENERAL CTF TIPS:\n• ${randomTips.join('\n• ')}`;
}

const uploadAvatar = multer({ 
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

// Validation middleware
const validateImageType = (req, res, next) => {
  if (req.file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid image type' });
    }
  }
  next();
};

const validateChallengeSubmission = [
  check('flag')
    .notEmpty().withMessage('Flag is required')
    .isString().withMessage('Flag must be a string')
    .trim()
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'VALIDATION_ERROR',
        message: errors.array()[0].msg 
      });
    }
    next();
  }
];

const validateChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id).populate('author');
    if (!challenge) {
      return res.status(404).json({
        error: 'CHALLENGE_NOT_FOUND',
        message: 'Challenge not found'
      });
    }
    req.challenge = challenge;
    next();
  } catch (err) {
    next(err);
  }
};
const validateDiscussionId = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_ID',
      message: 'Invalid discussion ID format'
    });
  }
  next();
};

const validateCommentId = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_ID',
      message: 'Invalid comment ID format'
    });
  }
  next();
};

const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 20;
// Add discussion validation middleware
const validateDiscussion = [
  check('title').trim().escape().isLength({ min: 5, max: 200 })
    .withMessage('Title must be 5-200 characters'),
  check('content').trim().escape().isLength({ min: 10, max: 5000 })
    .withMessage('Content must be 10-5000 characters'),
  check('tags').optional().isArray({ max: MAX_TAGS })
    .withMessage(`Maximum ${MAX_TAGS} tags allowed`),
  check('tags.*').trim().escape().isLength({ min: 2, max: MAX_TAG_LENGTH })
    .withMessage(`Each tag must be 2-${MAX_TAG_LENGTH} characters`)
];

// Add comment validation middleware
const validateComment = [
  check('content').trim().escape().isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be 1-2000 characters'),
  check('parentComment').optional().isMongoId()
    .withMessage('Invalid parent comment ID')
];

// Add vote validation middleware
const validateVote = [
  check('type').isIn(['upvote', 'downvote', 'remove'])
    .withMessage('Invalid vote type')
];

// Add solution validation middleware
const validateSolution = [
  check('commentId').isMongoId()
    .withMessage('Invalid comment ID')
];
// Utility functions
const normalizeFlag = (flag) => flag.trim().toLowerCase();
const calculatePoints = (difficulty) => {
  const pointsMap = { easy: 100, medium: 200, hard: 300 };
  return pointsMap[difficulty] || 100;
};
const securityHeaders = helmet();
module.exports = {
  limiter,
  chatLimiter,
  chatRateLimiter,
  createChallengeLimiter,
  submitLimiter,
  authenticateToken,
  uploadAvatar,
  validateImageType,
  getPredefinedResponse,
  getGeneralCTFAdvice,
  validateChallengeSubmission,
  validateChallenge,
  normalizeFlag,
  calculatePoints,
  securityHeaders,
  validateDiscussionId,
  validateCommentId,
  validateDiscussion,
  validateComment,
  validateVote,
  validateSolution
};