import { PrismaClient } from '@prisma/client';
import { destinationCountry, originCountry } from '../src/common/country';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const nationality = user.nationality ?? originCountry(user);
    if (user.nationality !== nationality) await prisma.user.update({ where: { id: user.id }, data: { nationality } });
    const requests = await prisma.serviceRequest.findMany({ where: { userId: user.id }, select: { id: true, serviceType: true, formData: true } });
    for (const request of requests) {
      const form = request.formData && typeof request.formData === 'object' && !Array.isArray(request.formData) ? request.formData as Record<string, unknown> : {};
      const next = { ...form, originCountry: typeof form.originCountry === 'string' && form.originCountry !== 'Unknown' ? form.originCountry : nationality, destinationCountry: destinationCountry(form, request.serviceType) };
      await prisma.serviceRequest.update({ where: { id: request.id }, data: { formData: next } });
    }
  }
  console.log(`Backfilled ${users.length} users and their country fields.`);
}

main().finally(() => prisma.$disconnect());
