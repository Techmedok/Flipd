const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const redirectIfAuthenticated = async (request, reply) => {
  const token = request.cookies.token;

  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return reply.redirect('/dashboard'); // Redirect if the token is valid
    } catch (err) {
      reply.clearCookie('token', { path: '/' }); // Clear invalid token
    }
  }
};

module.exports = redirectIfAuthenticated;
