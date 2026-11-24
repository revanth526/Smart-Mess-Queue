const { z } = require('zod');

const generateSlotsSchema = z.object({
  body: z.object({
    menuId: z.string().min(1, 'menuId is required'),
  }),
});

module.exports = {
  generateSlotsSchema,
};
