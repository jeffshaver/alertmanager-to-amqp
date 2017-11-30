const amqp = require('amqplib')
const { logger } = require('./logger')

async function connect(endpoint) {
  let connection
  let channel

  try {
    connection = await amqp.connect(endpoint)
    channel = await connection.createChannel()

    connection.on('error', e => {
      logger.error(e)
    })
    connection.on('close', () => {
      logger.warn('AMQP connection closed. Reconnecting...')
      setTimeout(() => connect(endpoint))
    })
  } catch (e) {
    logger.warn(e)
    setTimeout(() => connect(endpoint))
  }

  return { connection, channel }
}

module.exports = { connect }
