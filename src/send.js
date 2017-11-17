const amqp = require('amqplib')
const logger = require('./logger')

const { AMQP_ENDPOINT, QUEUE } = process.env

async function send(message) {
  try {
    const connection = await amqp.connect(AMQP_ENDPOINT)
    const channel = await connection.createChannel()

    await channel.assertQueue(QUEUE)
    channel.sendToQueue(QUEUE, Buffer.from(message))
  } catch (e) {
    logger.warn(e)
  }
}

module.exports = { send }
