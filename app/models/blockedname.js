const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async () => {
  const blockedNames = await prisma.blockedName.findMany();
  return blockedNames;
};

exports.isBlocked = async (name) => {
  try {
    const blockedNames = await prisma.blockedName.findFirst({
      where: {
        name,
      },
    });

    return blockedNames;
  } catch (error) {
    return error;
  }
};

exports.store = async (name, reason = null) => {
  try {
    const isBlocked = await this.isBlocked(name);

    if (isBlocked === true) {
      return;
    }

    const blockedName = await prisma.blockedName.create({
      data: {
        name,
        reason,
      },
    });
    return blockedName;
  } catch (error) {
    return error;
  }
};
