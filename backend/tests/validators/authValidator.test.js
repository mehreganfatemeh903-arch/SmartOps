const { validateRegister, validateLogin } = require('../../validators/authValidator');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authValidator', () => {
  describe('validateRegister', () => {
    it('calls next() with valid data', () => {
      const req = { body: { email: 'test@example.com', password: '123456', name: 'Test' } };
      const res = mockRes();
      const next = jest.fn();

      validateRegister(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects invalid email', () => {
      const req = { body: { email: 'not-an-email', password: '123456' } };
      const res = mockRes();
      const next = jest.fn();

      validateRegister(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects short password', () => {
      const req = { body: { email: 'test@example.com', password: '123' } };
      const res = mockRes();
      const next = jest.fn();

      validateRegister(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects missing password', () => {
      const req = { body: { email: 'test@example.com' } };
      const res = mockRes();
      const next = jest.fn();

      validateRegister(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateLogin', () => {
    it('calls next() with valid data', () => {
      const req = { body: { email: 'test@example.com', password: 'anything' } };
      const res = mockRes();
      const next = jest.fn();

      validateLogin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects missing email', () => {
      const req = { body: { password: 'anything' } };
      const res = mockRes();
      const next = jest.fn();

      validateLogin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
