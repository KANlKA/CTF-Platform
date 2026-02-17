// models.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  displayName: { type: String, default: '' },
  bio: { type: String, default: '' },
  todoChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  solvedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  createdChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  points: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  avatar: { 
    type: String,
    default: 'default_avatar.png'
  },
  socialLinks: {
    github: String,
    twitter: String,
    website: String
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

const ChallengeSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    minlength: 5,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    minlength: 20
  },
  category: { 
    type: String, 
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    required: true 
  },
  points: {
    type: Number, 
    required: true,
    min: 0
  },
  flag: { 
    type: String, 
    required: true,
    minlength: 3
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  solves: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  hints: [{
    text: String,
    cost: { type: Number, default: 50 }
  }],
  files: [{
    filename: String,
    originalName: String,
    size: Number,
    mimetype: String,
  }],
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isClosed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  discussion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isSolution: {
    type: Boolean,
    default: false
  },
  edited: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create models
const User = mongoose.model('User', UserSchema);
const Challenge = mongoose.model('Challenge', ChallengeSchema);
const Discussion = mongoose.model('Discussion', discussionSchema);
const Comment = mongoose.model('Comment', commentSchema);

UserSchema.index({ username: 1, email: 1 });
ChallengeSchema.index({ category: 1, difficulty: 1 });

async function migrateChallenges() {
  try {
    // Only run if explicitly enabled in env
    if (process.env.RUN_MIGRATIONS !== 'true') return;

    let systemUser = await User.findOne({ username: 'system' });
    if (!systemUser) {
      systemUser = new User({
        username: 'system',
        email: 'system@ctf-platform.com',
        password: await bcrypt.hash('system_password', 10),
        role: 'system'
      });
      await systemUser.save();
    }

    // Only migrate truly orphaned challenges
    const challenges = await Challenge.find({
      $or: [
        { author: { $exists: false } },
        { author: null },
        { author: { $type: 'string' } }
      ]
    });

    if (challenges.length > 0) {
      console.log(`Migrating ${challenges.length} challenges to system user`);
      await Challenge.updateMany(
        { _id: { $in: challenges.map(c => c._id) } },
        { $set: { author: systemUser._id } }
      );
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}
module.exports = {
  User,
  Challenge,
  Discussion,
  Comment,
  migrateChallenges
};