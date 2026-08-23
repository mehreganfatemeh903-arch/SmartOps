const {
  listUsersQuerySchema,
  taskStatsQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  objectIdParamValidation,
  validateQuery,
  validateBody
} = require('../../validators/adminValidators');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('adminValidators', () => {
  describe('validateQuery(listUsersQuerySchema)', () => {
    const middleware = validateQuery(listUsersQuerySchema);

    it('applies defaults with empty query', () => {
      const req = { query: {} };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(1);
      expect(req.query.limit).toBe(20);
      expect(req.query.sortBy).toBe('createdAt');
    });

    it('rejects limit above 100', () => {
      const req = { query: { limit: '500' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects invalid sortBy', () => {
      const req = { query: { sortBy: 'hackedField' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateQuery(taskStatsQuerySchema)', () => {
    const middleware = validateQuery(taskStatsQuerySchema);

    it('accepts a valid date range', () => {
      const req = { query: { from: '2026-01-01', to: '2026-06-01' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects "to" date before "from" date', () => {
      const req = { query: { from: '2026-06-01', to: '2026-01-01' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateBody(updateUserRoleSchema)', () => {
    const middleware = validateBody(updateUserRoleSchema);

    it('accepts a valid role', () => {
      const req = { body: { role: 'admin' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects an unsupported role', () => {
      const req = { body: { role: 'manager' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateBody(updateUserStatusSchema)', () => {
    const middleware = validateBody(updateUserStatusSchema);

    it('accepts a valid status', () => {
      const req = { body: { status: 'suspended', reason: 'policy violation' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects missing status', () => {
      const req = { body: {} };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('objectIdParamValidation', () => {
    it('calls next() with a valid ObjectId', () => {
      const req = { params: { id: '507f1f77bcf86cd799439011' } };
      const res = mockRes();
      const next = jest.fn();

      objectIdParamValidation(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects an invalid ObjectId', () => {
      const req = { params: { id: 'bad-id' } };
      const res = mockRes();
      const next = jest.fn();

      objectIdParamValidation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
