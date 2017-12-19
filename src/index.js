require('dotenv').config({ path: '.env', silent: true })

const {
  AMQP_ENDPOINT,
  CA_CERT_LOCATION,
  CLIENT_CERT_LOCATION,
  CLIENT_CERT_KEY_LOCATION,
  CLIENT_KEY_LOCATION,
  CLIENT_KEY_PASSPHRASE,
  QUEUE
} = process.env
const http = require('http')
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
const express = require('express')
const compression = require('compression')
const serveStatic = require('serve-static')
const bodyParser = require('body-parser')
const { ReconnectingAMQP } = require('./reconnecting-amqp')
const { logger } = require('./logger')
let options = {}

if (
  CLIENT_CERT_KEY_LOCATION !== undefined &&
  (CLIENT_CERT_LOCATION !== undefined || CLIENT_KEY_LOCATION !== undefined)
) {
  logger.error(
    'Paths for both a PKCS12 and CRT/KEY have been provided. You must only provide CLIENT_CERT_KEY_LOCATION or CLIENT_CERT_LOCATION and CLIENT_KEY_LOCATION'
  )
  process.exit(1)
}

const hasAmqpOptions =
  CA_CERT_LOCATION ||
  CLIENT_CERT_LOCATION ||
  CLIENT_CERT_KEY_LOCATION ||
  CLIENT_KEY_LOCATION ||
  CLIENT_KEY_PASSPHRASE

if (hasAmqpOptions) {
  const readFile = path => {
    try {
      return path ? fs.readFileSync(path) : undefined
    } catch (e) {
      logger.error(`Tried to read file at path \`${e.path}\`. ${e.message}`)
      process.exit(1)
    }
  }

  let ca = [readFile(CA_CERT_LOCATION)]
  let cert = readFile(CLIENT_CERT_LOCATION)
  let key = readFile(CLIENT_KEY_LOCATION)
  let passphrase = CLIENT_KEY_PASSPHRASE
  let pfx = readFile(CLIENT_CERT_KEY_LOCATION)

  options = { ca, cert, key, passphrase, pfx }
}
const amqp = new ReconnectingAMQP(AMQP_ENDPOINT, options)

start()

async function start() {
  const app = express()
  const httpServer = http.createServer(app)

  await amqp.connect()

  app.use(compression())
  app.use(bodyParser.json())

  app.post('/', (req, res) => {
    logger.info(req.body)

    amqp.sendToQueue(QUEUE, JSON.stringify(req.body))

    res.status(200).send('ok')
  })

  app.use(function(err, req, res, next) {
    logger.error(err.stack)
    res.status(500).send('Something broke!')
  })

  httpServer.listen(3000, () => {
    logger.info('app listening on port 3000')
  })
}
