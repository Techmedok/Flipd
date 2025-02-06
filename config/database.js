const fastifyPostgres = require('@fastify/postgres');
const { DB_CONNECTION_STRING } = require('./env');

module.exports = async function (fastify) {
  fastify.register(fastifyPostgres, { connectionString: DB_CONNECTION_STRING });
};