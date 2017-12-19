const amqp = require('amqplib')
const { logger } = require('./logger')

class ReconnectingAMQP {
  constructor(endpoint, options) {
    this.connection = null
    this.channel = null
    this.endpoint = endpoint
    this.options = options
  }

  async connect() {
    try {
      this.connection = await amqp.connect(this.endpoint, this.options)
      logger.info(`Successfully connected to ${this.endpoint}`)
      this.channel = await this.connection.createChannel()
      logger.info('Successfully created channel')

      this.connection.on('close', () => {
        logger.warn('AMQP connection closed. Reconnecting...')
        this.connect()
      })
    } catch (e) {
      logger.warn(e)
    }
  }

  async sendToQueue(queue, message) {
    try {
      await this.channel.assertQueue(queue)
      this.channel.sendToQueue(queue, Buffer.from(message))
    } catch (e) {
      logger.warn(e)
      channel.close()
      connection.close()
    }
  }
}

module.exports = { ReconnectingAMQP }
