mongoose.connect(process.env.TEST_DB_URI || 'mongodb://localhost:27017/testdb', {
  auth: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS
  },
  authSource: 'admin'
});
