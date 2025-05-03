// Mock request/response helpers
module.exports = {
    mockRequest: (body = {}, params = {}, query = {}, file = null) => ({
      body,
      params,
      query,
      file,
      headers: {}
    }),
    mockResponse: () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      res.send = jest.fn().mockReturnValue(res);
      return res;
    }
  };
