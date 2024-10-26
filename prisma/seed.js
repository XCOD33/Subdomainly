const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcrypt')

async function main() {
    const dataUser = [
        {
            email: 'denistraju155@gmail.com',
            name: 'Rico Aditya',
            password: await bcrypt.hash(process.env.PASSWORD_USER_1, 10),
        },
        {
            email: 'deanabdillah@gmail.com',
            name: 'Dean Abdillah',
            password: await bcrypt.hash(process.env.PASSWORD_USER_2, 10),
        }
    ]

    const dataDomain = {
        domain: 'subdomainly.com',
        zoneId: '3354d74d608d852ef36e76d4044a4cbf'
    }

    try {
        const user = await Promise.all(
            dataUser.map(user => prisma.user.create({data: user}))
        )
        const domain = await prisma.domain.create({
            data: dataDomain
        })

        console.log(user, domain)
    } catch (e) {
        console.error(e)
    }
}
main().then(async() => {
    console.log('Seed success')
    await prisma.$disconnect()
})
.catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
})