const Mongoose = require('mongoose')
const Schema   = Mongoose.Schema

const User = require('./user')

// SCHEMA ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const options = {
  discriminatorKey: 'type'
}

const FacebookUser = new Schema({
  facebookId: { type: String, required: true },
  avatar:     { type: String }
}, options)

module.exports = User.discriminator('facebook', FacebookUser)
