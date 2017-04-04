const LocalStrategy         = require('passport-local').Strategy
const BearerStrategy        = require('passport-http-bearer').Strategy
const FacebookTokenStrategy = require('passport-facebook-token')

const jwt = require('jsonwebtoken')

const User         = require('../models/user')
const Admin        = require('../models/admin')
const FacebookUser = require('../models/facebook_user')
const PKCDUser     = require('../models/pkcd_user')

module.exports = (app, passport) => {
  app.use(passport.initialize())

  passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, callback) => {
    PKCDUser
    .findOne({ email: email })
    .exec((err, user) => {
      if (err)   return callback(err)
      if (!user) return callback(null, false)
      if (jwt.sign(password, '<secret>') == user.password) {
        return callback(null, user)
      } else {
        return callback(null, false)
      }
    })
  }))

  passport.use('local-admin', new LocalStrategy({ usernameField: 'username' }, (username, password, callback) => {
    Admin
    .findOne({ username: username })
    .exec((err, user) => {
      if (err)   return callback(err)
      if (!user) return callback(null, false)
      if (jwt.sign(password, '<secret>') == user.password) {
        return callback(null, user)
      } else {
        return callback(null, false)
      }
    })
  }))

  passport.use(new BearerStrategy({}, (token, callback) => {
    PKCDUser
    .findOne({ token: token })
    .exec((err, user) => {
      if (err)   return callback(err)
      if (!user) return callback(null, false)
      return callback(null, user)
    })
  }))

  passport.use('bearer-admin', new BearerStrategy({}, (token, callback) => {
    Admin
    .findOne({ token: token })
    .exec((err, user) => {
      if (err)   return callback(err)
      if (!user) return callback(null, false)
      return callback(null, user)
    })
  }))

  passport.use(new FacebookTokenStrategy({
    clientID: "1855430544704460",
    clientSecret: "fa0707b0dfaf612163ea890658b34615",
    // clientID: '403743173294806',
    // clientSecret: '22d3452ddb2ac9b22503beb812cdf6cc',
    // profileFields: ['id', 'name', 'picture']
  }, (accessToken, refreshToken, profile, cb) => {
    FacebookUser
    .findOne({ facebookId: profile.id })
    .exec((err, user) => {
      if (err) return callback(err)
      if (!user) {
        let fbuser = new FacebookUser({
          name:       profile.name,
          facebookId: profile.id,
          avatar:     profile.picture,
          token:      jwt.sign(accessToken, '<secret>'),
          type:       'facebook'
        })

        fbuser.save((err, fbuser) => {
          if (err) return callback(err)
          return callback(null, fbuser)
        })
      } else {
        return callback(null, user)
      }
    })
  }))

  passport.serializeUser((user, callback) => {
    callback(null, user)
  })

  passport.deserializeUser((user, callback) => {
    callback(null, user)
  })
}
