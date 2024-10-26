const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.find = async (email) => {
    try {
        return await prisma.user.findFirst(
            {
                where: {
                    email,
                }
            }
        )
    } catch (error) {
        return error
    }
}