const fastify = require('fastify')({ logger: true });
const fastifyStatic = require('@fastify/static');
const fastifyPostgres = require('@fastify/postgres');
const fastifyCookie = require('@fastify/cookie');
const fastifyFormbody = require('@fastify/formbody');
const sha3 = require('js-sha3');
const path = require('path');
const emailValidator = require('email-validator');

// Register Fastify plugins
fastify.register(fastifyPostgres, {
  connectionString: 'postgresql://flipduser:e0eqR1hCucTH8S188Z2yXrt0JFExAzru@161.97.70.226:5432/flipddb'
});

fastify.register(fastifyCookie);
fastify.register(fastifyFormbody);
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

// Middleware to check authentication
const isLoggedIn = async (request, reply) => {
  const userId = request.cookies.auth;

  if (userId) {
    if (request.url === '/signin' || request.url === '/signup') {
      return reply.redirect('/dashboard');
    }
  } else {
    const protectedRoutes = ['/dashboard'];
    if (protectedRoutes.includes(request.url)) {
      return reply.redirect('/signin');
    }
  }
};

fastify.addHook('preHandler', async (request, reply) => {
  await isLoggedIn(request, reply);
});

// Routes
fastify.get('/', async (request, reply) => reply.sendFile('index.html'));
fastify.get('/signup', async (request, reply) => reply.sendFile('signup.html'));
fastify.get('/signin', async (request, reply) => reply.sendFile('signin.html'));
fastify.get('/dashboard', async (request, reply) => reply.sendFile('dashboard.html'));

// Helper function for password validation
const validatePassword = (password) => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// Signup route
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
    const hashedPassword = sha3.sha3_256(password);  // Use SHA3-256 for password hashing
    const client = await fastify.pg.connect();
    await client.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hashedPassword]);
    client.release();
    return reply.send({ success: true, message: "Signup successful. Please login." });
  } catch (err) {
    if (err.code === "23505") { // Duplicate email error
      return reply.status(400).send({ success: false, message: "Email already in use" });
    }
    return reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

// Signin route
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

    reply.setCookie('auth', rows[0].id, { path: '/' });
    return reply.send({ success: true, message: "Login successful", redirect: "/dashboard" });
  } catch (err) {
    return reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

// Logout route
fastify.get('/logout', async (request, reply) => {
  reply.clearCookie('auth', { path: '/' });
  return reply.redirect('/');
});

// Start server
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
