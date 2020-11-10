const { Post, Users } = require('../models')
const response = require('../helpers/response')
const Joi = require('joi')
const search = require('../helpers/searching')
const sort = require('../helpers/sorting')
const paging = require('../helpers/pagination')
const { Op } = require('sequelize')

module.exports = {
  createPost: async (req, res) => {
    try {
      const { id: userId } = req.user
      const schema = Joi.object({
        title: Joi.string().messages({
          'string.empty': 'Title can\'t be empty'
        }),
        news: Joi.string().messages({
          'string.empty': 'Post can\'t be empty'
        })
      })
      const find = await Users.findByPk(userId)
      if (find) {
        const { value, error } = schema.validate(req.body)
        if (error) {
          return response(res, error.message, {}, 400, false)
        }
        const { title, news } = value
        const data = { userId, title, news }
        const results = await Post.create(data)
        if (results) {
          return response(res, 'Create post successfully', { data: results }, 201)
        } else {
          return response(res, 'Failed to create', {}, 400, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
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
  getPosts: async (req, res) => {
    try {
      const { searchKey, searchValue } = search.post(req.query.search)
      const { sortKey, sortBy } = sort.post(req.query.sort)
      const count = await Post.count({
        where: {
          [searchKey]: {
            [Op.like]: `%${searchValue}%`
          }
        }
      })
      const { pageInfo, offset } = paging(req, count)
      const results = await Post.findAll({
        where: {
          [searchKey]: {
            [Op.like]: `%${searchValue}%`
          }
        },
        order: [[sortKey, sortBy]],
        limit: pageInfo.limit,
        offset
      })
      if (results) {
        return response(res, 'List of News', { data: results, pageInfo })
      } else {
        return response(res, 'News not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  getPost: async (req, res) => {
    try {
      const { id } = req.params
      const results = await Post.findByPk(id)
      if (results) {
        return response(res, 'Detail News', { data: results })
      } else {
        return response(res, 'News not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  getAuthorPosts: async (req, res) => {
    try {
      const { id: userId } = req.params
      const { searchKey, searchValue } = search.post(req.query.search)
      const { sortKey, sortBy } = sort.post(req.query.sort)
      const user = await Users.findByPk(userId)
      if (user) {
        const count = await Post.count({
          where: {
            userId,
            [searchKey]: {
              [Op.like]: `%${searchValue}%`
            }
          }
        })
        const { pageInfo, offset } = paging(req, count)
        const results = await Post.findAll({
          where: {
            userId,
            [searchKey]: {
              [Op.like]: `%${searchValue}%`
            }
          },
          order: [[sortKey, sortBy]],
          limit: pageInfo.limit,
          offset
        })
        if (results.length) {
          return response(res, 'List of News', { user, data: results, pageInfo })
        } else {
          return response(res, 'User does\'t have post', {}, 404, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  getAuthorPost: async (req, res) => {
    try {
      const { userId, id } = req.params
      const user = await Users.findByPk(userId)
      if (user) {
        const results = await Post.findAll({ where: { userId, id } })
        if (results.length) {
          return response(res, 'Detail News', { data: results })
        } else {
          return response(res, 'News not found', {}, 404, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  getOwnPosts: async (req, res) => {
    try {
      const { id: userId } = req.user
      console.log(userId)
      const { searchKey, searchValue } = search.post(req.query.search)
      const { sortKey, sortBy } = sort.post(req.query.sort)
      const count = await Post.count({
        where: {
          userId,
          [searchKey]: {
            [Op.like]: `%${searchValue}%`
          }
        }
      })
      const { pageInfo, offset } = paging(req, count)
      const results = await Post.findAll({
        where: {
          userId,
          [searchKey]: {
            [Op.like]: `%${searchValue}%`
          }
        },
        order: [[sortKey, sortBy]],
        limit: pageInfo.limit,
        offset
      })
      if (results) {
        return response(res, 'List of News', { data: results, pageInfo })
      } else {
        return response(res, 'News not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  updateOwnAll: async (req, res) => {
    try {
      const { id: userId } = req.user
      const { id } = req.params
      const schema = Joi.object({
        title: Joi.string().required().messages({
          'string.empty': 'Title can\'t be empty',
          'any.required': 'Title must be filled'
        }),
        news: Joi.string().required().messages({
          'string.empty': 'Post can\'t be empty',
          'any.required': 'Post must be filled'
        })
      })
      const user = await Users.findByPk(userId)
      if (user) {
        const find = await Post.findAll({ where: { userId, id } })
        if (find.length) {
          const { value, error } = schema.validate(req.body)
          if (error) {
            return response(res, error.message, {}, 400, false)
          }
          const results = await Post.update(value, { where: { id } })
          if (results) {
            return response(res, 'Update successfully', { data: value })
          } else {
            return response(res, 'Failed to update', {}, 400, false)
          }
        } else {
          return response(res, 'News not found', {}, 404, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  updateOwnPartial: async (req, res) => {
    try {
      const { id: userId } = req.user
      const { id } = req.params
      const user = await Users.findByPk(userId)
      if (user) {
        const find = await Post.findAll({ where: { userId, id } })
        if (find.length) {
          let value = Object.entries(req.body).map(i => {
            return { [i[0]]: `${i[1]}` }
          })
          value = Object.assign(...value, {})
          const results = await Post.update(value, { where: { id } })
          if (results) {
            return response(res, 'Update successfully', { data: value })
          } else {
            return response(res, 'Failed to update', {}, 400, false)
          }
        } else {
          return response(res, 'News not found', {}, 404, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  deleteOwnPost: async (req, res) => {
    try {
      const { id: userId } = req.user
      const { id } = req.params
      const user = await Users.findByPk(userId)
      if (user) {
        const find = await Post.findAll({ where: { userId, id } })
        if (find.length) {
          const results = await Post.destroy({ where: { id } })
          if (results) {
            return response(res, 'Delete successfully')
          } else {
            return response(res, 'Failed to delete', {}, 400, false)
          }
        } else {
          return response(res, 'News not found', {}, 404, false)
        }
      } else {
        return response(res, 'User not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  updateAll: async (req, res) => {
    try {
      const { id } = req.params
      const schema = Joi.object({
        title: Joi.string().required().messages({
          'string.empty': 'Title can\'t be empty',
          'any.required': 'Title must be filled'
        }),
        news: Joi.string().required().messages({
          'string.empty': 'Post can\'t be empty',
          'any.required': 'Post must be filled'
        })
      })
      const find = await Post.findByPk(id)
      if (find) {
        const { value, error } = schema.validate(req.body)
        if (error) {
          return response(res, error.message, {}, 400, false)
        }
        const results = await Post.update(value, { where: { id } })
        if (results) {
          return response(res, 'Update successfully', { data: value })
        } else {
          return response(res, 'Failed to update', {}, 400, false)
        }
      } else {
        return response(res, 'News not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  updatePartial: async (req, res) => {
    try {
      const { id } = req.params
      const find = await Post.findByPk(id)
      if (find.length) {
        let value = Object.entries(req.body).map(i => {
          return { [i[0]]: `${i[1]}` }
        })
        value = Object.assign(...value, {})
        const results = await Post.update(value, { where: { id } })
        if (results) {
          return response(res, 'Update successfully', { data: value })
        } else {
          return response(res, 'Failed to update', {}, 400, false)
        }
      } else {
        return response(res, 'News not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  deletePost: async (req, res) => {
    try {
      const { id } = req.params
      const find = await Post.findByPk(id)
      if (find.length) {
        const results = await Post.destroy({ where: { id } })
        if (results) {
          return response(res, 'Delete successfully')
        } else {
          return response(res, 'Failed to delete', {}, 400, false)
        }
      } else {
        return response(res, 'News not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  }
}
