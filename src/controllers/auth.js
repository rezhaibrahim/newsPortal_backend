/* eslint-disable camelcase */
const { Users } = require('../models')
const response = require('../helpers/response')
const Joi = require('joi')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { ADMIN_KEY, USER_KEY } = process.env

module.exports = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().required().messages({
        'any.required': 'Please insert your email',
        'string.empty': 'Please insert your email'
      }),
      password: Joi.string().required().messages({
        'any.required': 'Please insert your password',
        'string.empty': 'Please insert your password'
      })
    })
    const { value, error } = schema.validate(req.body)
    if (error) {
      return response(res, error.message, {}, 400, false)
    } else {
      const { email, password } = value
      const find = await Users.findOne({ where: { email } })
      if (find) {
        const id = find.id
        const hashed = find.password
        const role_id = find.role_id
        const compared = await bcrypt.compare(password, hashed)
        if (compared) {
          switch (req.params.role) {
            case 'admin': {
              if (role_id === 1) {
                jwt.sign({ id }, ADMIN_KEY, { expiresIn: '30 days' }, (err, token) => {
                  if (err) {
                    return response(res, err.message, 500, false)
                  } else {
                    return response(res, 'Login as admin successfully', { token })
                  }
                })
              } else {
                return response(res, 'Wrong email or password', {}, 400, false)
              }
              break
            }
            case 'user': {
              if (role_id === 2) {
                jwt.sign({ id }, USER_KEY, { expiresIn: '30 days' }, (err, token) => {
                  if (err) {
                    return response(res, err.message, 500, false)
                  } else {
                    return response(res, 'Login as user successfully', { token })
                  }
                })
              } else {
                return response(res, 'Wrong email or password', {}, 400, false)
              }
              break
            }
            default: {
              return response(res, 'Wrong path', {}, 400, false)
            }
          }
        } else {
          return response(res, 'Wrong password', {}, 400, false)
        }
      } else {
        return response(res, 'Wrong email', {}, 400, false)
      }
    }
  } catch (err) {
    return response(res, err.message, {}, 400, false)
  }
}
