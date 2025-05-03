const {
  normalizeFlag,
  calculatePoints,
  getPredefinedResponse,
  getGeneralCTFAdvice,
  authenticateToken,
  validateImageType,

} = require('../middleware');

const jwt = require('jsonwebtoken');
const { mockRequest, mockResponse } = require('./testHelpers');
  
  describe('Utility Functions', () => {
    test('normalizeFlag works correctly', () => {
      expect(normalizeFlag(' FLAG{Test} ')).toBe('flag{test}');
    });
  
    test('calculatePoints returns correct values', () => {
      expect(calculatePoints('easy')).toBe(100);
      expect(calculatePoints('medium')).toBe(200);
      expect(calculatePoints('hard')).toBe(300);
    });
  
    test('getPredefinedResponse returns correct messages', () => {
      expect(getPredefinedResponse('hello')).toMatch(/Hello! How can I help/);
      expect(getPredefinedResponse('random')).toBeNull();
    });
  
    test('getGeneralCTFAdvice returns tips', () => {
      const advice = getGeneralCTFAdvice();
      expect(advice).toMatch(/GENERAL CTF TIPS:/);
      expect(advice).toMatch(/\•/); // Check for bullet points
    });
  });
  
  describe('Middleware', () => {
    let req, res, next;
  
    beforeEach(() => {
      req = mockRequest();
      res = mockResponse();
      next = jest.fn();
      process.env.JWT_SECRET = 'test-secret';
    });
  
    test('authenticateToken validates correctly', () => {
      authenticateToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  
    test('authenticateToken accepts valid token', () => {
      const token = jwt.sign({ id: 'test' }, 'test-secret');
      req.headers.authorization = `Bearer ${token}`;
      authenticateToken(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  
    test('validateImageType checks file types', () => {
      req.file = { mimetype: 'image/png' };
      validateImageType(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
