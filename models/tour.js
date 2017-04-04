const Mongoose = require('mongoose')
const Schema   = Mongoose.Schema

const Business = require('./business')

// SCHEMA ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const options = {
  discriminatorKey: 'category'
}

const Tour = new Schema({}, options)

module.exports = Business.discriminator('tour', Tour)
