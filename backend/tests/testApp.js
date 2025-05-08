// backend/tests/testApp.js
const express = require('express');
const routes = require('../routes');

async function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // Mock OpenAI if in test environment
  if (process.env.NODE_ENV === 'test') {
    app.set('openai', {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: { content: "This is a mock AI response" }
            }]
          })
        }
      }
    });
  }
  
  app.use('/', routes);
  return app;
}

module.exports = createTestApp;
