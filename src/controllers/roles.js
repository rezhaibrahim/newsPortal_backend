const { Roles } = require('../models')
const response = require('../helpers/response')
const pagination = require('../helpers/pagination')
const sort = require('../helpers/sorting')
const { Op } = require('sequelize')

module.exports = {
  createRole: async (req, res) => {
    try {
      const { roleName } = req.body
      const results = await Roles.create({ roleName })
      return response(res, 'Create role successfully', { data: results })
    } catch (err) {
      return response(res, 'Failed to create role', {}, 400, false)
    }
  },
  getRoles: async (req, res) => {
    try {
      const { search = '' } = req.query
      const { sortKey, sortBy } = sort.roles(req.query.sort)
      console.log(sortKey, sortBy)
      const count = await Roles.count({
        where: {
          roleName: {
            [Op.like]: `%${search}%`
          }
        }
      })
      const { pageInfo, offset } = pagination(req, count)
      const results = await Roles.findAll({
        where: {
          roleName: {
            [Op.like]: `%${search}%`
          }
        },
        order: [[sortKey, sortBy]],
        limit: pageInfo.limit,
        offset
      })
      if (results.length) {
        return response(res, 'Data of roles', { data: results, pageInfo })
      } else {
        return response(res, 'Data not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  getRole: async (req, res) => {
    try {
      const { id } = req.params
      const results = await Roles.findByPk(id)
      if (results) {
        return response(res, `Data of role id ${id}`, { data: results })
      } else {
        return response(res, 'Data not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  updateRole: async (req, res) => {
    try {
      const { id } = req.params
      const { roleName } = req.body
      if (roleName) {
        const results = await Roles.update({ roleName }, { where: { id } })
        if (results) {
          return response(res, 'Update successfully', { data: { roleName } })
        } else {
          return response(res, 'Failed to update', {}, 400, false)
        }
      } else {
        return response(res, 'Failed to update', {}, 400, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  },
  deleteRole: async (req, res) => {
    try {
      const { id } = req.params
      const find = await Roles.findByPk(id)
      if (find) {
        const results = await Roles.destroy({ where: { id } })
        if (results) {
          return response(res, 'Delete role successfully')
        } else {
          return response(res, 'Failed to delete', {}, 400, false)
        }
      } else {
        return response(res, 'Role not found', {}, 404, false)
      }
    } catch (err) {
      return response(res, err.message, {}, 400, false)
    }
  }
}
