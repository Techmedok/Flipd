const verifyToken = require('../middlewares/authMiddleware');

module.exports = async function (fastify) {
  fastify.get('/dashboard', { preHandler: verifyToken }, async (request, reply) => {
    return reply.sendFile('dashboard.html');
  });

  fastify.get('/api/dashboard', { preHandler: verifyToken }, async (request, reply) => {
    return { message: 'biren.ftw', 'saved': 23 };
  });
};