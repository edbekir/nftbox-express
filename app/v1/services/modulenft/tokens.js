const { sequelize } = require('../../models')
const { Op } = require('sequelize')
const _ = require('lodash')
const axios = require('axios')
require('dotenv').config()

const Upsert = (values, condition) => {
    return sequelize.models.tokens
        .findOne({ where: condition })
        .then(async (obj) => {
            if (obj) return await obj.update(values)
            return await sequelize.models.tokens.create(values)
        })
}

module.exports.getTokensTraits = async () => {}

module.exports.getTokenIds = async () => {
    try {
        let apiKey = await sequelize.models.configurations.findOne({
            where: {
                key: 'ModuleNftApiKey'
            }
        })

        apiKey = _.isEmpty(apiKey) ? null : apiKey?.value

        const resAllCollections = await sequelize.models.collections.findAll({
            where: {
                [Op.or]: [
                    { string_traits: { [Op.ne]: null } },
                    { numeric_traits: { [Op.ne]: null } },
                    { checked_tarits: true }
                ]
            }
        })

        for (let k = 0; k < resAllCollections.length; k++) {
            try {
                if (
                    resAllCollections[k].total_supply <
                    resAllCollections[k].owners_count
                ) {
                    continue
                    const resGetTokenIds = await axios({
                        method: 'get',
                        url: `${process.env.MODULE_NFT_BASEURL}/opensea/collection/tokens?type=${resAllCollections[k].contract_address}&count=100&offset=0`,
                        headers: {
                            'X-API-KEY': apiKey,
                            'x-bypass-cache': true
                        }
                    })

                    if (resGetTokenIds?.status !== 200) continue
                    if (resGetTokenIds?.data?.error !== null) continue

                    const tokens = resGetTokenIds.data?.tokens
                    for (let i = 0; i < tokens.length; i++) {
                        try {
                            const checkToken =
                                await sequelize.models.tokens.findOne({
                                    collectionId: resAllCollections[k].id,
                                    token_id: tokens[i].tokenId
                                })
                            if (!_.isEmpty(checkToken)) continue
                            await sequelize.models.tokens.create({
                                collectionId: resAllCollections[k].id,
                                token_id: tokens[i].tokenId,
                                token_image: tokens[i].image_url
                            })
                        } catch (e) {
                            console.log(e)
                        }
                    }
                } else {
                }
            } catch (e) {
                console.log(e)
                continue
            }
        }
    } catch (e) {
        console.log(e)
    }
}
