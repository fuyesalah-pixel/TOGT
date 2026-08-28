const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

prisma.user.updateMany({
  where: { email: { equals: 'fuadnesredinhiyar@gmail.com', mode: 'insensitive' } },
  data: { role: 'ADMIN' },
}).then((result) => {
  console.log(`Fuad admin promotion updated ${result.count} account(s)`);
}).finally(() => prisma.$disconnect());
