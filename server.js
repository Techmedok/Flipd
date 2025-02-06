require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const fastifyStatic = require('@fastify/static');
const fastifyPostgres = require('@fastify/postgres');
const fastifyCookie = require('@fastify/cookie');
const fastifyFormbody = require('@fastify/formbody');
const jwt = require('jsonwebtoken');
const sha3 = require('js-sha3');
const path = require('path');
const emailValidator = require('email-validator');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '12h';

fastify.register(fastifyPostgres, {
  connectionString: process.env.DB_CONNECTION_STRING
});

fastify.register(fastifyCookie);
fastify.register(fastifyFormbody);
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

// JWT Verification Middleware
const verifyToken = async (request, reply) => {
  const token = request.cookies.token;

  if (!token) {
    if (['/dashboard'].includes(request.url)) {
      return reply.redirect('/signin');
    }
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;

    // Prevent access to signin/signup if already authenticated
    if (['/signin', '/signup'].includes(request.url)) {
      return reply.redirect('/dashboard');
    }
  } catch (err) {
    reply.clearCookie('token', { path: '/' });
    return reply.redirect('/signin');
  }
};

fastify.addHook('preHandler', verifyToken);

// Routes
fastify.get('/', async (request, reply) => reply.sendFile('index.html'));
fastify.get('/signup', async (request, reply) => reply.sendFile('signup.html'));
fastify.get('/signin', async (request, reply) => reply.sendFile('signin.html'));
fastify.get('/dashboard', async (request, reply) => reply.sendFile('dashboard.html'));

// Helper Functions
const validatePassword = (password) => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// Signup Route
fastify.post('/signup', async (request, reply) => {
  const { name, email, password, confirmPassword } = request.body;

  if (!name || !email || !password || !confirmPassword) {
    return reply.status(400).send({ success: false, message: "All fields are required" });
  }

  if (!emailValidator.validate(email)) {
    return reply.status(400).send({ success: false, message: "Invalid email format" });
  }

  if (!validatePassword(password)) {
    return reply.status(400).send({ success: false, message: "Password must be at least 8 characters, contain at least one letter, one number, and one special character" });
  }

  if (password !== confirmPassword) {
    return reply.status(400).send({ success: false, message: "Password and Confirm Password must match" });
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
    console.log(err);
    return reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

// Signin Route
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
      return reply.status(401).send({ success: false, message: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRATION }
    );

    // Update last login
    await fastify.pg.connect().then(client => {
      client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [rows[0].id]);
      client.release();
    });

    // Set JWT token as HTTP-only cookie
    reply.setCookie('token', token, { 
      path: '/', 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 12 * 60 * 60 // 12 hours in seconds
    });

    return reply.send({ success: true, redirect: "/dashboard" });
  } catch (err) {
    return reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

// Logout Route
fastify.get('/logout', async (request, reply) => {
  reply.clearCookie('token', { path: '/' });
  return reply.redirect('/');
});

// Start Server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();