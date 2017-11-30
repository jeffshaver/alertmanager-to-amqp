const { logger } = require('./logger')

async function send(connection, channel, queue, message) {
  try {
    await channel.assertQueue(queue)
    channel.sendToQueue(queue, Buffer.from(message))
  } catch (e) {
    logger.warn(e)
    channel.close()
    connection.close()
  }
}

module.exports = { send }
