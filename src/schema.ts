const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      repoPatterns: { type: 'array', items: { type: 'string' } },
      labels: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            color: { type: 'string' },
            action: { type: 'string', enum: ['create', 'delete', 'rename'] },
            rename_from: { type: 'string' },
          },
          required: ['name'],
          oneOf: [
            {
              properties: {
                action: { enum: ['create', 'delete'] },
              },
            },
            { required: ['rename_from'] },
          ],
        },
      },
      action: { type: 'string', enum: ['create', 'delete'] },
    },
  },
}

export default schema
