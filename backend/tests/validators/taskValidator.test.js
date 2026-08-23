const { validateCreateTask, validateUpdateTask } = require('../../validators/taskValidator');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('taskValidator', () => {
  describe('validateCreateTask', () => {
    it('calls next() with valid data', () => {
      const req = { body: { title: 'My Task', priority: 'high' } };
      const res = mockRes();
      const next = jest.fn();

      validateCreateTask(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects empty title', () => {
      const req = { body: { title: '' } };
      const res = mockRes();
      const next = jest.fn();

      validateCreateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects invalid priority', () => {
      const req = { body: { title: 'Task', priority: 'urgent' } };
      const res = mockRes();
      const next = jest.fn();

      validateCreateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateUpdateTask', () => {
    it('calls next() with valid partial data', () => {
      const req = { body: { status: 'done' } };
      const res = mockRes();
      const next = jest.fn();

      validateUpdateTask(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects invalid status', () => {
      const req = { body: { status: 'archived' } };
      const res = mockRes();
      const next = jest.fn();

      validateUpdateTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
