require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const path = require('path');
const fastifyStatic = require('@fastify/static');
const fastifyPostgres = require('@fastify/postgres');
const fastifyCookie = require('@fastify/cookie');
const fastifyFormbody = require('@fastify/formbody');

const { DB_CONNECTION_STRING } = require('./config/env');

// Register Plugins
fastify.register(fastifyPostgres, { connectionString: DB_CONNECTION_STRING });
fastify.register(fastifyCookie);
fastify.register(fastifyFormbody);
fastify.register(fastifyStatic, { root: path.join(__dirname, 'public'), prefix: '/' });

// Register Routes
fastify.register(require('./routes/auth'));
fastify.register(require('./routes/dashboard'));
fastify.register(require('./routes/addArticle'));

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