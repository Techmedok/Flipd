const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const verifyToken = async (request, reply) => {
  const token = request.cookies.token;

  if (!token) {
    return reply.redirect('/signin');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;

    if (['/signin', '/signup'].includes(request.url)) {
      return reply.redirect('/dashboard');
    }
  } catch (err) {
    reply.clearCookie('token', { path: '/' });
    return reply.redirect('/signin');
  }
};

module.exports = verifyToken;