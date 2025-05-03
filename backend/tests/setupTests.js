// Mock OpenAI for testing
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: { content: "This is a test hint" }
          }]
        })
      }
    }
  }));
});
