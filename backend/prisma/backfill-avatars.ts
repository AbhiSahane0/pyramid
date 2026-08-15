/**
 * Gives existing accounts the generated avatars that new sign-ups now get.
 *
 *   npm run backfill:avatars           # only accounts with no picture
 *   npm run backfill:avatars -- --force  # every account, replacing what is there
 *   npm run backfill:avatars -- --dry-run
 *
 * Demo personas are always skipped: their look belongs to the design, not to
 * this generator. `--force` does replace Google profile photos, which is why
 * it is opt-in.
 */
import { PrismaClient } from '@prisma/client';
import { defaultAvatarUrl } from '../src/common/avatar';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');

  const users = await prisma.user.findMany({
    where: {
      isDemo: false,
      ...(force ? {} : { avatarUrl: null }),
    },
    select: { id: true, name: true, email: true, username: true },
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    console.log('Nothing to do — every account already has a picture.');
    return;
  }

  console.log(
    `${dryRun ? 'Would update' : 'Updating'} ${users.length} account(s)${
      force ? ' (replacing existing pictures)' : ''
    }:`,
  );

  for (const user of users) {
    // Same seed the app uses, so a backfilled account and a fresh one that
    // signs up with the same details end up with the same face.
    const avatarUrl = defaultAvatarUrl(user.username ?? user.email);
    const style = avatarUrl.split('/9.x/')[1].split('/')[0];
    console.log(`  ${user.name} <${user.email}> → ${style}`);

    if (!dryRun) {
      await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
