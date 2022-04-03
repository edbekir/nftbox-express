const Model = require('../../models').sequelize
const { permissions,authurize } = require('../../middlewares')
const admins = {}

admins.register = async(req, res) => {
    try {
        const bodys = req.body
        delete bodys['id']
        if (req.isAuthenticated(req, res)) {
            const resCheckPermission = await permissions.check(req.user[0].role.id, ['admins'])
            if (resCheckPermission != true)
                return res.status(resCheckPermission.status).send(resCheckPermission.content)

            const resRegisterAdmin = await Model.models.admins.create(bodys)
            return res.status(201).send(resRegisterAdmin)
        }
        res.status(401).send('Unauthorized')
    } catch (e) {
        res.status(400).send({ message: String(e.message) })
    }
}

admins.login = async(req, res) => {
    try {
        const { username, password } = req.body

        if (username && password) {
            const loginCheck = await Model.models.admins.findAll({
                where: {
                    username: username,
                    password: password
                },
                include: { model: Model.models.admins_roles, as: 'role' }
            })

            if (loginCheck[0] != null) {
                const reqAdmins = (loginCheck).map(item => {
                    try {
                        Model.models.activitylogs.create({
                            adminId: item.id,
                            description: "new login from admin",
                            created_date: String(Date.now)
                        }).then(console.log)
                    } catch (e) { console.log(e) }
                    return {
                        id: item.id,
                        role: {
                            id: item.role.id,
                            role_name: item.role.role_name,
                            color: item.role.color,
                            createdAt: item.role.createdAt,
                            updatedAt: item.role.updatedAt
                        },
                        name: item.name,
                        username: item.username,
                        password: item.password,
                        last_login: item.last_login,
                        email: item.email,
                        phone: item.phone,
                        activated: item.activated,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                        token: auth.jwt(loginCheck[0])
                    }
                })
                return res.status(200).send(reqAdmins)
            }
        }
        res.status(400).send({ login: false, redirect: '/v1/admins/login', message: "invalid input" })
    } catch (e) {
        res.status(400).send({ message: String(e.message) })
    }
}

admins.dashboard = async(req, res) => {
    try {
        if (req.isAuthenticated(req, res))
            return res.status(200).send(req.user)

        res.status(401).send('Unauthorized')
    } catch {
        res.status(400).send({ message: 'something is wrong' })
    }
}


module.exports = admins