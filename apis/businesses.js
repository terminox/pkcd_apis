const express = require('express')
const router  = express.Router()

const Business   = require('../models/business')
const Attraction = require('../models/attraction')
const Hotel      = require('../models/hotel')
const Restaurant = require('../models/restaurant')
const Spa        = require('../models/spa')
const Tour       = require('../models/tour')
const Image      = require('../models/image')

const passport = require('passport')
const _        = require('underscore')
const async    = require('async')
const multer   = require('multer')

router.get('/', passport.authenticate(['bearer', 'bearer-admin']), (req, res) => {
  let query    = req.query
  let contents = query.contents != undefined ? query.contents : 'full'
  let number   = query.limit    != undefined ? query.limit : 20
  let fields   = _.pick({
    name:         _.contains(['full', 'listed', 'pin', 'thumbnail'], contents),
    category:     _.contains(['full', 'listed', 'pin', 'thumbnail'], contents),
    description:  _.contains(['full', 'pin'], contents),
    address:      _.contains(['full', 'pin'], contents),
    facilities:   _.contains(['full'], contents),
    cover:        _.contains(['full', 'listed'], contents),
    thumbnail:    _.contains(['full', 'thumbnail'], contents),
    coordinates:  _.contains(['full', 'pin'], contents),
    contacts:     _.contains(['full'], contents),
    openTime:     _.contains(['full'], contents),
    closeTime:    _.contains(['full'], contents),
    checkInTime:  _.contains(['full'], contents),
    checkOutTime: _.contains(['full'], contents),
    price       : _.contains(['full', 'listed', 'pin', 'thumbnail'], contents)
  }, (value, key, object) => {
    return !value
  })
  let criteria = (() => {
    let c = (category => {
      switch (category) {
        case 'attraction':
        case 'hotel':
        case 'restaurant':
        case 'spa':
        case 'tour':
          return { category }

        case 'favourites':
          return { favourites: { $elemMatch: { $eq: req.user._id } } }

        case 'all':
        default:
          return {}
      }
    })(query.category)

    if (query.search) c['$text'] = { $search: query.search }

    return c
  })()

  Business
  .find(criteria)
  .select(fields)
  .limit(number)
  .exec((err, businesses) => {
    if (err) return res.status(500).send(err)
    res.json(businesses)
  })
})

router.get('/:_uid', passport.authenticate(['bearer', 'bearer-admin']), (req, res) => {
  let uid      = req.params._uid
  let criteria = _.isNaN(Number(uid)) ? { _id: uid } : { business_id: uid }

  Business
  .findOne(criteria)
  .exec((err, business) => {
    if (err)       return res.status(500).send(err)
    if (!business) return res.sendStatus(404)
    let businessCopy = Object.assign({}, business._doc)
    businessCopy.isFavourite = businessCopy.favourites.indexOf(req.user._id) != -1
    delete businessCopy.favourites
    res.json(businessCopy)
  })
})

router.put('/:business_id/fav', passport.authenticate('bearer'), (req, res) => {
  Business
  .findOne({ business_id: req.params.business_id })
  .exec((err, business) => {
    if (err) return res.status(500).send(err)
    business.favourites.push(req.user._id)
    business.save((err, business) => {
      if (err) return res.status(500).send(err)
      res.sendStatus(200)
    })
  })
})

router.post('/', multer().fields([{ name: 'cover', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), (req, res) => {
  passport.authenticate('bearer-admin')(req, res, () => {
    let files = req.files

    async.auto({
      cover: (callback) => {
        if (!files)       return callback()
        if (!files.cover) return callback()

        let file  = files.cover[0]
        let image = new Image({
          buffer:      file.buffer,
          contentType: file.mimetype
        })

        image.save((err, image) => {
          callback(null, image)
        })
      },

      thumbnail: (callback) => {
        if (!files)           return callback()
        if (!files.thumbnail) return callback()

        let file  = files.thumbnail[0]
        let image = new Image({
          buffer:      file.buffer,
          contentType: file.mimetype
        })

        image.save((err, image) => {
          callback(null, image)
        })
      }
    }, (err, results) => {
      let body      = req.body
      let business  = classifiedBusiness(body)
      let cover     = results.cover
      let thumbnail = results.thumbnail
      if (cover)     business.cover     = cover
      if (thumbnail) business.thumbnail = thumbnail
      if (body.tel)      business.contacts.tel      = body.tel
      if (body.website)  business.contacts.website  = body.website
      if (body.email)    business.contacts.email    = body.email
      if (body.facebook) business.contacts.facebook = body.facebook
      if (body.lat)      business.coordinates.lat   = body.lat
      if (body.lng)      business.coordinates.lng   = body.lng
      business.save((err, business) => {
        if (err) return res.status(500).send(err)
        res.json(business)
      })
    })
  })
})

router.put('/:_id', multer().fields([{ name: 'cover', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), (req, res) => {
  passport.authenticate('bearer-admin')(req, res, () => {
    let body  = req.body
    let files = req.files

    async.parallel([
      (callback) => {
        body.contacts    = {}
        body.coordinates = {}
        if (body.tel)      body.contacts.tel      = body.tel
        if (body.website)  body.contacts.website  = body.website
        if (body.email)    body.contacts.email    = body.email
        if (body.facebook) body.contacts.facebook = body.facebook
        if (body.lat)      body.coordinates.lat   = body.lat
        if (body.lng)      body.coordinates.lng   = body.lng

        Business
        .update({ _id: req.params._id }, {
          $set: body
        }, (err, ...r) => {
          if (err) return callback(err)
          callback()
        })
      },

      (callback) => {
        if (!files) return callback()

        async.auto({
          business: (cb) => {
            Business
            .findOne({ _id: req.params._id })
            .exec((err, business) => {
              if (err)       return cb(err)
              if (!business) return cb()
              cb(null, business)
            })
          },

          cover: ['business', (results, cb) => {
            if (!files.cover) return cb()
            let cover = files.cover[0]

            if (results.business.cover) {
              Image
              .findOne({ _id: results.business.cover })
              .exec((err, image) => {
                image.buffer      = cover.buffer
                image.contentType = cover.mimetype
                image.save((err, image) => {
                  cb(null, image)
                })
              })
            } else {
              let image = new Image({
                buffer:      cover.buffer,
                contentType: cover.mimetype
              })

              image.save((err, image) => {
                cb(null, image)
              })
            }
          }],

          thumbnail: ['business', (results, cb) => {
            if (!files.thumbnail) return cb()
            let thumbnail = files.thumbnail[0]

            if (results.business.thumbnail) {
              Image
              .findOne({ _id: results.business.thumbnail })
              .exec((err, image) => {
                image.buffer      = thumbnail.buffer
                image.contentType = thumbnail.mimetype
                image.save((err, image) => {
                  cb(null, image)
                })
              })
            } else {
              let image = new Image({
                buffer:      thumbnail.buffer,
                contentType: thumbnail.mimetype
              })

              image.save((err, image) => {
                cb(null, image)
              })
            }
          }]
        }, (err, results) => {
          callback()
        })
      }
    ], (err, results) => {
      res.sendStatus(200)
    })
  })
})

router.delete('/:_id', (req, res) => {
  passport.authenticate('bearer-admin')(req, res, () => {
    Business
    .findOne({ _id: req.params._id })
    .exec((err, business) => {
      business.remove((err, ...r) => {
        if (err) return res.status(500).send(err)
        res.sendStatus(200)
      })
    })
  })
})

function classifiedBusiness(body) {
  switch (body.category) {
    case 'attraction':
      return new Attraction(body)
    case 'hotel':
      return new Hotel(body)
    case 'restaurant':
      return new Restaurant(body)
    case 'spa':
      return new Spa(body)
    case 'tour':
      return new Tour(body)
    default:
      return new Business(body)
  }
}

module.exports = router
