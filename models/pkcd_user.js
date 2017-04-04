const Mongoose = require('mongoose')
const Schema   = Mongoose.Schema

const User  = require('./user')
const Image = require('./image')

const async = require('async')

// SCHEMA ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const options = {
  discriminatorKey: 'type'
}

const PKCDUser = new Schema({
  email:    { type: String, required: true },
  password: { type: String, required: true },
  avatar:   { type: Schema.Types.ObjectId, ref: 'Image' }
}, options)

// MIDDLEWARES :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
PKCDUser.post('remove', (user) => {
  Image
  .findOne({ _id: user.avatar })
  .exec((err, image) => {
    image.remove()
  })
})

module.exports = User.discriminator('pkcd', PKCDUser)
