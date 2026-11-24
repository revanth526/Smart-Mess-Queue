const { ValidationError } = require('../errors');

function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      throw new ValidationError(result.error.issues);
    }

    // Write transformed data back so Zod transforms (e.g. email lowercasing) take effect
    const parsed = result.data;
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  };
}

module.exports = {
  validate,
};
