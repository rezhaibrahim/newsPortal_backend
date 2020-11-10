const { Users } = require('../models')
const response = require('../helpers/response')
const paging = require('../helpers/pagination')
const search = require('../helpers/searching')
const sort = require('../helpers/sorting')
const { Op } = require('sequelize')

module.exports = {
  getUsers: async (req, res) => {
    try {
      const { searchKey, searchValue } = search.users(req.query.search)
      const { sortKey, sortBy } = sort.users(req.query.sort)
      const count = await Users.count({
        where: {
          [searchKey]: {
            [Op.like]: `%${searchValue}%`
          },
          role_id: 2
        }
      })
      const { pageInfo, offset } = paging(req, count)
      const results = await Users.findAll({
        where: {
          [searchKey]: {
            [Op.like]: `%${searchValue}%`
          },
          role_id: 2
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
  }
}
