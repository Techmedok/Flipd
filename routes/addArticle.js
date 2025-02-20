const verifyToken = require('../middlewares/authMiddleware');

module.exports = async function (fastify) {
  fastify.post('/addArticle', 
    { 
      preHandler: verifyToken, 
      schema: {
        body: {
          type: 'object',
          required: ['url', 'sourcecode'],
          properties: {
            url: { type: 'string' },
            sourcecode: { type: 'string' }
          }
        }
      }
    }, 
    async (request, reply) => {
      const { url, sourcecode } = request.body;
      console.log('URL:', url);
      // console.log('Source Code:', sourcecode);

      return reply.send({ message: 'Page saved successfully!' });
    }
  );
};
