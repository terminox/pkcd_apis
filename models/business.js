const Mongoose = require('mongoose')
const Schema   = Mongoose.Schema

const Image = require('./image')

const async = require('async')

// SCHEMA ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const options = {
  discriminatorKey: 'category'
}

const Business = new Schema({
  name:        { type: String, required: true },
  description: { type: String },
  address:     { type: String },
  facilities:  { type: [String] },
  cover:       { type: Schema.Types.ObjectId, ref: 'Image' },
  thumbnail:   { type: Schema.Types.ObjectId, ref: 'Image' },

  category: {
    type: String,
    enum: ['hotel', 'restaurant', 'tour', 'attraction', 'spa'],
    required: true
  },

  coordinates: {
    lng: Number,
    lat: Number
  },

  contacts: {
    tel:      String,
    website:  String,
    email:    String,
    facebook: String
  },

  favourites: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, options)

Business.index({ name: 'text' })

// PLUGINS :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const autoIncrement = require('mongoose-auto-increment')
const timestamps    = require('mongoose-timestamp')
const deepPopulate  = require('mongoose-deep-populate')(Mongoose)

Business.plugin(autoIncrement.plugin, { model: 'Business', field: 'business_id', startAt: 0, incrementBy: 1 })
Business.plugin(timestamps)
Business.plugin(deepPopulate)

// MIDDLEWARES :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
Business.post('validate', (business) => {
  if (business.cover) business.thumbnail = business.cover
})

Business.post('remove', (business) => {
  async.auto({
    cover: (callback) => {
      Image
      .findOne({ _id: business.cover })
      .exec((err, image) => {
        if (image) image.remove()
      })
    },

    thumbnail: (callback) => {
      Image
      .findOne({ _id: business.cover })
      .exec((err, image) => {
        if (image) image.remove()
      })
    }
  }, (err, results) => {})
})

module.exports = Mongoose.model('Business', Business)
