const {
  createProjectSchema,
  updateProjectSchema,
  validateBody,
  validateObjectIdParam
} = require('../../validators/projectValidator');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('projectValidator', () => {
  describe('validateBody(createProjectSchema)', () => {
    const middleware = validateBody(createProjectSchema);

    it('calls next() with valid data', () => {
      const req = { body: { name: 'My Project' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects name shorter than 2 chars', () => {
      const req = { body: { name: 'A' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects missing name', () => {
      const req = { body: { description: 'no name here' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateBody(updateProjectSchema)', () => {
    const middleware = validateBody(updateProjectSchema);

    it('rejects empty body (min 1 field required)', () => {
      const req = { body: {} };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('accepts partial update', () => {
      const req = { body: { description: 'updated' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateObjectIdParam', () => {
    const middleware = validateObjectIdParam('id');

    it('calls next() with a valid ObjectId', () => {
      const req = { params: { id: '507f1f77bcf86cd799439011' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects an invalid ObjectId', () => {
      const req = { params: { id: 'not-a-valid-id' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
