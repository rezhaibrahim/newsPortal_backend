const { Users } = require('../models')
const response = require('../helpers/response')
const paging = require('../helpers/pagination')
const search = require('../helpers/searching')
const sort = require('../helpers/sorting')
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const Joi = require('joi')

module.exports = {
  createUser: async (req, res) => {
    try {
      let { name, email, password } = req.body
      const { role } = req.params
      console.log("asd",role)
      // eslint-disable-next-line camelcase
      let role_id = 0
      if (role === 'admin') {
        // eslint-disable-next-line camelcase
        role_id = 1
      } else if (role === 'user') {
        // eslint-disable-next-line camelcase
        role_id = 2
      }
      if (password.length < 8) {
        return response(res, 'Password is too short (min. 8 character)')
      }
      password = await bcrypt.hash(password, await bcrypt.genSalt())
      const data = { role_id, name, email, password }
      let results = await Users.create(data)
      if (results) {
        results = {
          ...results.dataValues,
          password: undefined
        }
        return response(res, 'Create user successfully', { data: results }, 201)
      } else {
        return response(res, 'Failed to signup', {}, 400, false)
      }
    } catch (err) {
      if (err.message.includes('\n')) {
        return response(res, 'All fields must be filled', {}, 400, false)
      } else if (err.message.includes('notNull')) {
        const msg = err.message.slice(19)
        return response(res, msg, {}, 400, false)
      } else if (err.errors) {
        const msg = err.errors[0].message
        return response(res, msg, {}, 400, false)
      } else {
        return response(res, err.message, {}, 400, false)
      }
    }
  },
  getUsers: async (req, res) => {
    try {
      const { searchKey, searchValue } = search.users(req.query.search)
      const { sortKey, sortBy } = sort.users(req.query.sort)
      const count = await Users.count({
        where: {
          [searchKey]: {
            [Op.like]: `%${searchValue}%`
          }
        }
      })
      const { pageInfo, offset } = paging(req, count)
      const results = await Users.findAll({
        where: {
          [searchKey]: {
            [Op.like]: `%${searchValue}%`
          }
        },
        // includes: [
        //   { model: Roles }
        // ]
        order: [[sortKey, sortBy]],
        limit: pageInfo.limit,
        offset,
        attributes: { exclude: ['password'] }
      })
      if (results) {
        return response(res, 'Data of Users', { data: results, pageInfo })
      } else {
        return response(res, 'Data not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  getUser: async (req, res) => {
    try {
      const { id } = req.params
      const results = await Users.findByPk(id, { attributes: { exclude: ['password'] } })
      if (results) {
        return response(res, 'Detail of user', { data: results })
      } else {
        return response(res, 'User not found', {}, 400, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  updateAll: async (req, res) => {
    try {
      const { id } = req.params
      const find = await Users.findByPk(id)
      if (find) {
        const { name, email, oldPassword, newPassword, confirmPassword } = req.body
        if (name && email && oldPassword && newPassword && confirmPassword) {
          const old = find.dataValues.password
          const oldPass = await bcrypt.compare(oldPassword, old)
          if (oldPass) {
            const change = oldPassword !== newPassword
            if (change) {
              const newPass = newPassword === confirmPassword
              if (newPass) {
                const password = await bcrypt.hash(newPassword, await bcrypt.genSalt())
                let data = { name, email, password }
                const results = await Users.update(data, { where: { id } })
                if (results) {
                  data = {
                    ...data,
                    password: undefined
                  }
                  return response(res, 'Update user successfully', { data })
                } else {
                  return response(res, 'Failed to update', {}, 400, false)
                }
              } else {
                return response(res, 'New password doesn\'t match', {}, 400, false)
              }
            } else {
              return response(res, 'Password doesn\'t change', {}, 400, false)
            }
          } else {
            return response(res, 'Your old password is wrong', {}, 400, false)
          }
        } else {
          return response(res, 'All fields must be filled', {}, 400, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      if (err.errors) {
        const msg = err.errors[0].message
        return response(res, msg, {}, 400, false)
      }
      return response(res, err.message, {}, 400, false)
    }
  },
  updatePartial: async (req, res) => {
    try {
      const { id } = req.params
      const find = await Users.findByPk(id)
      if (find) {
        let body = Object.entries(req.body).map(i => {
          return { [i[0]]: i[1] }
        })
        body = Object.assign(...body, {})
        const results = await Users.update(body, { where: { id } })
        if (results) {
          return response(res, 'Update successfully', { data: body })
        } else {
          return response(res, 'Failed to update', {}, 400, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      if (err.errors) {
        const msg = err.errors[0].message
        return response(res, msg, {}, 400, false)
      }
      return response(res, err.message, {}, 400, false)
    }
  },
  updatePassword: async (req, res) => {
    try {
      const { id } = req.params
      const find = await Users.findByPk(id)
      if (find) {
        const schema = Joi.object({
          oldPassword: Joi.string().required().messages({ 'any.required': 'Old password must be filled' }),
          newPassword: Joi.string().required().messages({ 'any.required': 'New password must be filled' }),
          confirmPassword: Joi.string().required().messages({ 'any.required': 'Please confirm your new password' })
        })
        const { value, error } = schema.validate(req.body)
        if (error) {
          return response(res, error.message, {}, 400, false)
        } else {
          const { oldPassword, newPassword, confirmPassword } = value
          const old = find.dataValues.password
          const oldPass = await bcrypt.compare(oldPassword, old)
          if (oldPass) {
            const change = oldPassword !== newPassword
            if (change) {
              const newPass = newPassword === confirmPassword
              if (newPass) {
                const password = await bcrypt.hash(newPassword, await bcrypt.genSalt())
                const data = { password }
                const results = await Users.update(data, { where: { id } })
                if (results) {
                  return response(res, 'Update password successfully')
                } else {
                  return response(res, 'Failed to update', {}, 400, false)
                }
              } else {
                return response(res, 'New password doesn\'t match', {}, 400, false)
              }
            } else {
              return response(res, 'Password doesn\'t change', {}, 400, false)
            }
          } else {
            return response(res, 'Your old password is wrong', {}, 400, false)
          }
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params
      const find = await Users.findByPk(id)
      if (find) {
        const results = await Users.destroy({ where: { id } })
        if (results) {
          return response(res, 'Delete user successfully')
        } else {
          return response(res, 'Failed to delete', {}, 400, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  getOwnUser: async (req, res) => {
    try {
      const { id } = req.user
      const results = await Users.findByPk(id, { attributes: { exclude: ['password'] } })
      if (results) {
        return response(res, 'Detail of user', { data: results })
      } else {
        return response(res, 'User not found', {}, 400, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  updateAllUser: async (req, res) => {
    try {
      const { id } = req.user
      const find = await Users.findByPk(id)
      if (find) {
        const { name, email, oldPassword, newPassword, confirmPassword } = req.body
        if (name && email && oldPassword && newPassword && confirmPassword) {
          const old = find.dataValues.password
          const oldPass = await bcrypt.compare(oldPassword, old)
          if (oldPass) {
            const change = oldPassword !== newPassword
            if (change) {
              const newPass = newPassword === confirmPassword
              if (newPass) {
                const password = await bcrypt.hash(newPassword, await bcrypt.genSalt())
                let data = { name, email, password }
                const results = await Users.update(data, { where: { id } })
                if (results) {
                  data = {
                    ...data,
                    password: undefined
                  }
                  return response(res, 'Update user successfully', { data })
                } else {
                  return response(res, 'Failed to update', {}, 400, false)
                }
              } else {
                return response(res, 'New password doesn\'t match', {}, 400, false)
              }
            } else {
              return response(res, 'Password doesn\'t change', {}, 400, false)
            }
          } else {
            return response(res, 'Your old password is wrong', {}, 400, false)
          }
        } else {
          return response(res, 'All fields must be filled', {}, 400, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      if (err.errors) {
        const msg = err.errors[0].message
        return response(res, msg, {}, 400, false)
      }
      return response(res, err.message, {}, 400, false)
    }
  },
  updatePartialUser: async (req, res) => {
    try {
      const { id } = req.user
      const find = await Users.findByPk(id)
      if (find) {
        let body = Object.entries(req.body).map(i => {
          return { [i[0]]: i[1] }
        })
        body = Object.assign(...body, {})
        const results = await Users.update(body, { where: { id } })
        if (results) {
          return response(res, 'Update successfully', { data: body })
        } else {
          return response(res, 'Failed to update', {}, 400, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      if (err.errors) {
        const msg = err.errors[0].message
        return response(res, msg, {}, 400, false)
      }
      return response(res, err.message, {}, 400, false)
    }
  },
  updatePasswordUser: async (req, res) => {
    try {
      const { id } = req.user
      const find = await Users.findByPk(id)
      if (find) {
        const schema = Joi.object({
          oldPassword: Joi.string().required().messages({ 'any.required': 'Old password must be filled' }),
          newPassword: Joi.string().required().messages({ 'any.required': 'New password must be filled' }),
          confirmPassword: Joi.string().required().messages({ 'any.required': 'Please confirm your new password' })
        })
        const { value, error } = schema.validate(req.body)
        if (error) {
          return response(res, error.message, {}, 400, false)
        } else {
          const { oldPassword, newPassword, confirmPassword } = value
          const old = find.dataValues.password
          const oldPass = await bcrypt.compare(oldPassword, old)
          if (oldPass) {
            const change = oldPassword !== newPassword
            if (change) {
              const newPass = newPassword === confirmPassword
              if (newPass) {
                const password = await bcrypt.hash(newPassword, await bcrypt.genSalt())
                const data = { password }
                const results = await Users.update(data, { where: { id } })
                if (results) {
                  return response(res, 'Update password successfully')
                } else {
                  return response(res, 'Failed to update', {}, 400, false)
                }
              } else {
                return response(res, 'New password doesn\'t match', {}, 400, false)
              }
            } else {
              return response(res, 'Password doesn\'t change', {}, 400, false)
            }
          } else {
            return response(res, 'Your old password is wrong', {}, 400, false)
          }
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  deleteMyAccount: async (req, res) => {
    try {
      const { id } = req.user
      const find = await Users.findByPk(id)
      if (find) {
        const results = await Users.destroy({ where: { id } })
        if (results) {
          return response(res, 'Delete user successfully')
        } else {
          return response(res, 'Failed to delete', {}, 400, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  }
}
