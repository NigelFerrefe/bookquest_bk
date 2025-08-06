const { z } = require("zod");

const authorSchema = z.object({
  name: z.string().min(1, "Name is required").transform(name => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }),
});

module.exports = { authorSchema};
