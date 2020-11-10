const jwt = require('jsonwebtoken')
const response = require('../helpers/response')

const { ADMIN_KEY, USER_KEY } = process.env

module.exports = {
  authAdmin: (req, res, next) => {
    const { authorization } = req.headers
    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.slice(7, authorization.length)
      try {
        const verify = jwt.verify(token, ADMIN_KEY)
        if (verify) {
          req.user = verify
          next()
        } else {
          return response(res, 'Unauthoraized', {}, 401, false)
        }
      } catch (err) {
        return response(res, err.message, {}, 500, false)
      }
    } else {
      return response(res, 'Forbidden Access', {}, 403, false)
    }
  },
  authUser: (req, res, next) => {
    const { authorization } = req.headers
    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.slice(7, authorization.length)
      try {
        const verify = jwt.verify(token, USER_KEY)
        if (verify) {
          req.user = verify
          next()
        } else {
          return response(res, 'Unauthoraized', {}, 401, false)
        }
      } catch (err) {
        return response(res, err.message, {}, 500, false)
      }
    } else {
      return response(res, 'Forbidden Access', {}, 403, false)
    }
  }
}
