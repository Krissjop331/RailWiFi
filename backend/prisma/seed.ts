import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tariffs = [
    { title: '1 час', durationMin: 60, priceKzt: 500 },
    { title: '3 часа', durationMin: 180, priceKzt: 1200 },
    { title: '8 часов', durationMin: 480, priceKzt: 2500 },
    { title: '24 часа', durationMin: 1440, priceKzt: 4500 },
  ];

  for (const t of tariffs) {
    await prisma.tariff.upsert({
      where: { id: t.title },
      update: { durationMin: t.durationMin, priceKzt: t.priceKzt, active: true },
      create: t as any,
    });
  }
  console.log('Seeded tariffs');
}

main().finally(async () => prisma.$disconnect());
