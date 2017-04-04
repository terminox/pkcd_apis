const express = require('express')
const router  = express.Router()

const User         = require('../models/user')
const PKCDUser     = require('../models/pkcd_user')
const FacebookUser = require('../models/facebook_user')

const async    = require('async')
const jwt      = require('jsonwebtoken')
const passport = require('passport')

router.get('/', passport.authenticate('bearer-admin'), (req, res) => {
  User
  .find({ type: { $ne: 'admin' } })
  .exec((err, users) => {
    if (err) return res.status(500).send(err)
    res.json(users)
  })
})

router.post('/', passport.authenticate('bearer-admin'), (req, res) => {
  let body = req.body

  async.auto({
    avatar: (callback) => {
      if (!req.file) return callback()
      let avatar = req.file.avatar
      if (!avatar)   return callback()

      let image = new Image({
        buffer:      avatar.buffer,
        contentType: avatar.mimetype
      })

      image.save((err, image) => {
        callback(null, image)
      })
    },

    user: (callback) => {
      PKCDUser
      .findOne({ email: body.email })
      .exec((err, user) => {
        callback(null, user)
      })
    }
  }, (err, results) => {
    if (results.user) return res.status(500).send("Email is already used.")

    let user = new PKCDUser({
      name:     body.name,
      email:    body.email,
      password: jwt.sign(body.password, '<secret>'),
      token:    jwt.sign((body.email + body.password), '<secret>'),
      type:     'pkcd'
    })

    if (results.avatar) user.avatar = results.avatar

    user.save((err, user) => {
      if (err) return res.status(500).send(err)
      res.json(user)
    })
  })
})

router.get('/:_id', passport.authenticate('bearer-admin'), (req, res) => {
  User
  .findOne({ _id: req.params._id })
  .select('-password')
  .exec((err, user) => {
    if (err) return res.status(500).send(err)
    res.json(user)
  })
})

router.put('/:_id', passport.authenticate('bearer-admin'), (req, res) => {
  let body = req.body

  PKCDUser
  .update({ _id: req.params._id }, {
    $set: body
  }, (err, ...r) => {
    if (err) return res.status(500).send(err)
    res.sendStatus(200)
  })
})

router.delete('/:_id', (req, res) => {
  res.sendStatus(200)
})

module.exports = router
