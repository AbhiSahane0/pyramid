/**
 * CLI seed: ensures the global demo members and labels exist.
 * Per-user demo workspaces are seeded automatically on first login
 * (see src/seed/workspace-seed.service.ts).
 *
 * Run with: npm run seed
 */
import { PrismaClient } from '@prisma/client';
import { DEMO_LABELS, DEMO_MEMBERS } from '../src/seed/demo-data';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  for (const m of DEMO_MEMBERS) {
    await prisma.user.upsert({
      where: { email: m.email },
      update: { name: m.name, title: m.title, avatarUrl: m.avatarUrl },
      create: {
        email: m.email,
        name: m.name,
        title: m.title,
        avatarUrl: m.avatarUrl,
        isDemo: true,
      },
    });
  }
  for (const name of DEMO_LABELS) {
    await prisma.label.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(
    `Seeded ${DEMO_MEMBERS.length} demo members and ${DEMO_LABELS.length} labels.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
