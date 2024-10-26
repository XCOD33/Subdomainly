const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async () => {
  return prisma.blockedName.findMany();
};

exports.isBlocked = async (name) => {
  try {
    return await prisma.blockedName.findFirst({
      where: {
        name,
        status: 'harmful',
      },
    });
  } catch (error) {
    return error;
  }
};

exports.store = async (name, reason = null, status = null) => {
  try {
    const isBlocked = await this.isBlocked(name);

    if (isBlocked === true) {
      return;
    }

    return await prisma.blockedName.create({
      data: {
        name,
        reason,
        status,
      },
    });
  } catch (error) {
    return error;
  }
};
