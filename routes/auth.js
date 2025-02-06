const sha3 = require('js-sha3');
const jwt = require('jsonwebtoken');
const emailValidator = require('email-validator');
const redirectIfAuthenticated = require('../middlewares/redirectIfAuthenticated');
const { JWT_SECRET, JWT_EXPIRATION, NODE_ENV } = require('../config/env');

module.exports = async function (fastify) {
//   fastify.get('/signup', async (request, reply) => reply.sendFile('signup.html'));
// fastify.get('/signin', async (request, reply) => reply.sendFile('signin.html'));

fastify.get('/signin', { preHandler: redirectIfAuthenticated }, async (request, reply) => {
  return reply.sendFile('signin.html');
});

fastify.get('/signup', { preHandler: redirectIfAuthenticated }, async (request, reply) => {
  return reply.sendFile('signup.html');
});

  fastify.post('/signup', async (request, reply) => {
    const { name, email, password, confirmPassword } = request.body;

    if (!name || !email || !password || !confirmPassword) {
      return reply.status(400).send({ success: false, message: "All fields are required" });
    }

    if (!emailValidator.validate(email)) {
      return reply.status(400).send({ success: false, message: "Invalid email format" });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      return reply.status(400).send({success: false, message: "Weak password"});
    }

    if (password !== confirmPassword) {
      return reply.status(400).send({ success: false, message: "Passwords do not match" });
    }

    try {
      const hashedPassword = sha3.sha3_256(password);
      const client = await fastify.pg.connect();

      await client.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', 
        [name, email, hashedPassword]
      );

      client.release();
      return reply.send({ success: true, message: "Signup successful. Please login." });
    } catch (err) {
      if (err.code === "23505") {
        return reply.status(400).send({ success: false, message: "Email already in use" });
      }
      return reply.status(500).send({ success: false, message: "Internal Server Error" });
    }
  });

  fastify.post('/signin', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ success: false, message: "Email and password are required" });
    }

    try {
      const client = await fastify.pg.connect();
      const { rows } = await client.query('SELECT * FROM users WHERE email=$1', [email]);
      client.release();

      if (rows.length === 0 || rows[0].password !== sha3.sha3_256(password)) {
        return reply.status(401).send({ success: false, message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

      await fastify.pg.connect().then(client => {
        client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [rows[0].id]);
        client.release();
      });

      reply.setCookie('token', token, { 
        path: '/', 
        httpOnly: true, 
        secure: NODE_ENV === 'production',
        maxAge: 12 * 60 * 60 // 12 hours
      });

      return reply.send({ success: true, redirect: "/dashboard" });
    } catch (err) {
      return reply.status(500).send({ success: false, message: "Internal Server Error" });
    }
  });

  fastify.get('/logout', async (request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return reply.redirect('/');
  });
};
