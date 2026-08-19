import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { AuthService } from '../src/auth/auth.service';
import type { HealthResponse } from '../src/health/health.controller';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * End-to-end smoke test against the real app pipeline and database.
 * Requires Postgres to be running (docker compose up -d) with migrations
 * applied. Creates a throwaway guest account and removes it afterwards.
 */
describe('Pyramid API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let cookies: string[];
  let createdTaskId: string;
  let workspaceId: string;

  const agent = () => request(app.getHttpServer());
  const authed = (req: request.Test) => req.set('Cookie', cookies);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    authService = app.get(AuthService);
  });

  afterAll(async () => {
    // Clean up the guest user and all cascading workspace data.
    if (cookies) {
      await authed(agent().delete('/api/users/me'));
    }
    await app.close();
  });

  it('reports healthy without authentication', async () => {
    const response = await agent().get('/api/health').expect(200);
    const body = response.body as HealthResponse;
    expect(body.status).toBe('ok');
    expect(body.database).toBe('up');
    expect(typeof body.uptime).toBe('number');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('rejects unauthenticated access to protected routes', async () => {
    await agent().get('/api/tasks').expect(401);
    await agent().get('/api/auth/me').expect(401);
  });

  it('creates a guest session with auth cookies', async () => {
    const response = await agent().post('/api/auth/guest').expect(201);
    expect(response.body.isGuest).toBe(true);
    expect(response.body.hashedRefreshToken).toBeUndefined();

    const setCookie = response.get('Set-Cookie') ?? [];
    cookies = setCookie.map((cookie: string) => cookie.split(';')[0]);
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
  });

  it('returns the current user via /auth/me', async () => {
    const response = await authed(agent().get('/api/auth/me')).expect(200);
    expect(response.body.isGuest).toBe(true);
  });

  it('seeds the demo workspace for new users', async () => {
    const tasks = await authed(agent().get('/api/tasks')).expect(200);
    expect(tasks.body.length).toBeGreaterThanOrEqual(12);

    const projects = await authed(agent().get('/api/projects')).expect(200);
    expect(projects.body.map((p: { name: string }) => p.name)).toEqual(
      expect.arrayContaining(['Design Homepage', 'Develop Login Feature']),
    );
  });

  it('starts real (Google) accounts with an empty workspace', async () => {
    const profile = {
      googleId: `e2e-google-${Date.now()}`,
      email: `e2e-google-${Date.now()}@example.com`,
      name: 'E2E Google User',
      avatarUrl: null,
    };
    const user = await authService.loginWithGoogle(profile);
    try {
      expect(user.isGuest).toBe(false);

      // Sign-up still provisions a workspace — it is just an empty one.
      const membership = await prisma.membership.findFirst({
        where: { userId: user.id },
      });
      expect(membership?.role).toBe('OWNER');

      const [tasks, projects] = await Promise.all([
        prisma.task.count({ where: { workspaceId: membership!.workspaceId } }),
        prisma.project.count({
          where: { workspaceId: membership!.workspaceId },
        }),
      ]);
      expect(tasks).toBe(0);
      expect(projects).toBe(0);

      // …but the shared member/label catalogue is still available to them.
      expect(await prisma.label.count()).toBeGreaterThan(0);
      expect(
        await prisma.user.count({ where: { isDemo: true } }),
      ).toBeGreaterThan(0);
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('ships a board with exactly one finished column', async () => {
    const response = await authed(agent().get('/api/columns')).expect(200);
    const done = response.body.filter(
      (column: { isDone: boolean }) => column.isDone,
    );
    // Without one, "overdue" would count finished work and "what did we
    // complete" could never answer anything.
    expect(done).toHaveLength(1);
    expect(done[0].name).toBe('Completed');
  });

  it('says the assistant is unavailable rather than failing', async () => {
    const status = await authed(agent().get('/api/assistant/status')).expect(
      200,
    );
    expect(typeof status.body.configured).toBe('boolean');

    // The suite runs without an API key, so asking must degrade rather than
    // throw — the same contract the mail service already keeps.
    if (!status.body.configured) {
      await authed(
        agent()
          .post('/api/assistant/ask')
          .send({ question: 'how many are overdue?' }),
      ).expect(503);
    }

    // An empty question never reaches the paid API.
    await authed(
      agent().post('/api/assistant/ask').send({ question: '' }),
    ).expect(400);
  });

  it('offers demo personas only where they actually hold tasks', async () => {
    // Runs on its own throwaway account: it has to create a second workspace,
    // and the shared session's tests below assume that one still has exactly
    // one.
    const guest = await agent().post('/api/auth/guest').expect(201);
    const guestCookies = (guest.get('Set-Cookie') ?? []).map(
      (cookie: string) => cookie.split(';')[0],
    );

    try {
      // The seeded workspace: the design's cast is assignable there.
      const demo = await agent()
        .get('/api/users/members')
        .set('Cookie', guestCookies)
        .expect(200);
      expect(demo.body.map((u: { name: string }) => u.name)).toEqual(
        expect.arrayContaining(['Admin', 'QA Team']),
      );

      // A workspace made from scratch is a real team, and must never be
      // offered someone else's sample colleagues.
      const fresh = await agent()
        .post('/api/workspaces')
        .set('Cookie', guestCookies)
        .send({ name: 'Real Team' })
        .expect(201);

      const members = await agent()
        .get('/api/users/members')
        .set('Cookie', guestCookies)
        .set('x-workspace-id', fresh.body.id as string)
        .expect(200);
      expect(members.body).toHaveLength(1);
      expect(members.body[0].name).toBe('Guest');
    } finally {
      await agent().delete('/api/users/me').set('Cookie', guestCookies);
    }
  });

  it('validates task input', async () => {
    const response = await authed(
      agent().post('/api/tasks').send({ title: '' }),
    ).expect(400);
    expect(response.body.statusCode).toBe(400);
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('title')]),
    );
  });

  it('creates, updates, moves and deletes a task', async () => {
    const columns = await authed(agent().get('/api/columns')).expect(200);
    const todo = columns.body.find((c: { name: string }) => c.name === 'To Do');
    const doing = columns.body.find(
      (c: { name: string }) => c.name === 'Doing',
    );

    const created = await authed(
      agent().post('/api/tasks').send({
        title: 'E2E smoke task',
        priority: 'MEDIUM',
        columnId: todo.id,
      }),
    ).expect(201);
    createdTaskId = created.body.id;
    expect(created.body.column.name).toBe('To Do');

    const updated = await authed(
      agent().patch(`/api/tasks/${createdTaskId}`).send({ priority: 'URGENT' }),
    ).expect(200);
    expect(updated.body.priority).toBe('URGENT');
    expect(
      updated.body.activities.some(
        (a: { type: string }) => a.type === 'priority_changed',
      ),
    ).toBe(true);

    await authed(
      agent()
        .patch(`/api/tasks/${createdTaskId}/move`)
        .send({ columnId: doing.id, position: 42 }),
    ).expect(200);

    await authed(agent().delete(`/api/tasks/${createdTaskId}`)).expect(204);
    await authed(agent().get(`/api/tasks/${createdTaskId}`)).expect(404);
  });

  it("cannot access another user's task", async () => {
    // A second guest should get a 404 for the first guest's data.
    const other = await agent().post('/api/auth/guest').expect(201);
    const otherCookies = (other.get('Set-Cookie') ?? []).map(
      (cookie: string) => cookie.split(';')[0],
    );

    const mine = await authed(agent().get('/api/tasks')).expect(200);
    const someTaskId = mine.body[0].id;

    await agent()
      .get(`/api/tasks/${someTaskId}`)
      .set('Cookie', otherCookies)
      .expect(404);

    await agent().delete('/api/users/me').set('Cookie', otherCookies);
  });

  // --- Workspaces, membership and invitations ---

  it('provisions a workspace with the signer-up as OWNER', async () => {
    const response = await authed(agent().get('/api/workspaces')).expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].role).toBe('OWNER');
    workspaceId = response.body[0].id;
  });

  it('hides a workspace from everyone who is not a member', async () => {
    const outsider = await agent().post('/api/auth/guest').expect(201);
    const outsiderCookies = (outsider.get('Set-Cookie') ?? []).map(
      (cookie: string) => cookie.split(';')[0],
    );

    // 404 rather than 403: never confirm that the workspace exists.
    await agent()
      .get('/api/tasks')
      .set('Cookie', outsiderCookies)
      .set('x-workspace-id', workspaceId)
      .expect(404);

    await agent().delete('/api/users/me').set('Cookie', outsiderCookies);
  });

  it('stores only the hash of an invitation token', async () => {
    const response = await authed(
      agent()
        .post('/api/workspaces/current/invitations')
        .set('x-workspace-id', workspaceId)
        .send({ email: 'invitee@example.com', role: 'MEMBER' }),
    ).expect(201);

    const token = (response.body.inviteUrl as string).split('/').pop()!;
    expect(token.length).toBeGreaterThan(20);

    const stored = await prisma.invitation.findFirst({
      where: { workspaceId, email: 'invitee@example.com' },
    });
    // The raw token must never be recoverable from the database.
    expect(stored?.tokenHash).not.toContain(token);
    expect(stored?.acceptedAt).toBeNull();

    // Anyone can describe an invite, but describing must not consume it.
    const preview = await agent().get(`/api/invitations/${token}`).expect(200);
    expect(preview.body.email).toBe('invitee@example.com');
    expect(
      (await prisma.invitation.findFirst({ where: { id: stored!.id } }))
        ?.acceptedAt,
    ).toBeNull();
  });

  it('refuses an invitation redeemed by a different account', async () => {
    const invite = await authed(
      agent()
        .post('/api/workspaces/current/invitations')
        .set('x-workspace-id', workspaceId)
        .send({ email: 'someone-else@example.com' }),
    ).expect(201);
    const token = (invite.body.inviteUrl as string).split('/').pop()!;

    // The signed-in guest's address is not the invited one.
    await authed(agent().post(`/api/invitations/${token}/accept`)).expect(403);
  });

  it('reports which workspace an invitation was accepted into', async () => {
    // The client needs this to land the new member in the workspace they
    // joined. Without it they arrive in whichever workspace happens to be
    // first — their own empty one — and joining looks like it failed.
    const stamp = Date.now();
    const invitee = await authService.loginWithGoogle({
      googleId: `e2e-joined-${stamp}`,
      email: `e2e-joined-${stamp}@example.com`,
      name: 'Joining User',
      avatarUrl: null,
    });

    try {
      const invite = await authed(
        agent()
          .post('/api/workspaces/current/invitations')
          .set('x-workspace-id', workspaceId)
          .send({ email: invitee.email }),
      ).expect(201);
      const token = (invite.body.inviteUrl as string).split('/').pop()!;

      const { accessToken } = await authService.issueTokens(invitee);
      const cookie = [`access_token=${accessToken}`];

      const accepted = await agent()
        .post(`/api/invitations/${token}/accept`)
        .set('Cookie', cookie)
        .expect(200);

      // The workspace they joined, not the one they already had.
      expect(accepted.body.workspaceId).toBe(workspaceId);

      const own = await agent()
        .get('/api/workspaces')
        .set('Cookie', cookie)
        .expect(200);
      expect(own.body).toHaveLength(2);
      expect(own.body[0].id).not.toBe(workspaceId);
    } finally {
      await prisma.user.delete({ where: { id: invitee.id } });
    }
  });

  it('stops serving a project to members once it is deleted', async () => {
    // The other half of the report: a member still seeing a project the owner
    // had removed. If the API ever answered with it, no amount of refetching
    // on the client would help — so pin the contract down here.
    const stamp = Date.now();
    const member = await authService.loginWithGoogle({
      googleId: `e2e-deleted-${stamp}`,
      email: `e2e-deleted-${stamp}@example.com`,
      name: 'Member Watching',
      avatarUrl: null,
    });

    try {
      const invite = await authed(
        agent()
          .post('/api/workspaces/current/invitations')
          .set('x-workspace-id', workspaceId)
          .send({ email: member.email }),
      ).expect(201);
      const token = (invite.body.inviteUrl as string).split('/').pop()!;

      const { accessToken } = await authService.issueTokens(member);
      const asMember = (req: request.Test) =>
        req
          .set('Cookie', [`access_token=${accessToken}`])
          .set('x-workspace-id', workspaceId);
      await agent()
        .post(`/api/invitations/${token}/accept`)
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(200);

      const project = await authed(
        agent()
          .post('/api/projects')
          .set('x-workspace-id', workspaceId)
          .send({ name: `Doomed ${stamp}` }),
      ).expect(201);
      const projectId = project.body.id as string;

      // The member can see it while it exists…
      const before = await asMember(agent().get('/api/projects')).expect(200);
      expect(before.body.map((p: { id: string }) => p.id)).toContain(projectId);

      await authed(
        agent()
          .delete(`/api/projects/${projectId}`)
          .set('x-workspace-id', workspaceId),
      ).expect(204);

      // …and not afterwards, by either route.
      const after = await asMember(agent().get('/api/projects')).expect(200);
      expect(after.body.map((p: { id: string }) => p.id)).not.toContain(
        projectId,
      );
      await asMember(agent().get(`/api/projects/${projectId}`)).expect(404);
    } finally {
      await prisma.user.delete({ where: { id: member.id } });
    }
  });

  it('refuses to guess the workspace for someone who belongs to several', async () => {
    // Reproduces what an invited member saw: their own sign-up workspace is
    // their oldest membership, so guessing served them an empty board instead
    // of the team they had just joined.
    const stamp = Date.now();
    const member = await authService.loginWithGoogle({
      googleId: `e2e-multi-${stamp}`,
      email: `e2e-multi-${stamp}@example.com`,
      name: 'Multi Workspace',
      avatarUrl: null,
    });

    try {
      const invite = await authed(
        agent()
          .post('/api/workspaces/current/invitations')
          .set('x-workspace-id', workspaceId)
          .send({ email: member.email }),
      ).expect(201);
      const token = (invite.body.inviteUrl as string).split('/').pop()!;

      const { accessToken } = await authService.issueTokens(member);
      const asMember = (req: request.Test) =>
        req.set('Cookie', [`access_token=${accessToken}`]);

      await asMember(agent().post(`/api/invitations/${token}/accept`)).expect(
        200,
      );

      // Two memberships now, so an unscoped request is genuinely ambiguous —
      // answering it with either workspace would be a guess.
      await asMember(agent().get('/api/tasks')).expect(400);

      // Named explicitly, they see the workspace they joined.
      const tasks = await asMember(
        agent().get('/api/tasks').set('x-workspace-id', workspaceId),
      ).expect(200);
      expect(tasks.body.length).toBeGreaterThan(0);

      // Reading the board is a member's right; managing people is not.
      await asMember(
        agent()
          .post('/api/workspaces/current/invitations')
          .set('x-workspace-id', workspaceId)
          .send({ email: 'nope@example.com' }),
      ).expect(403);
    } finally {
      await prisma.user.delete({ where: { id: member.id } });
    }
  });

  it('rejects an expired invitation', async () => {
    const invite = await authed(
      agent()
        .post('/api/workspaces/current/invitations')
        .set('x-workspace-id', workspaceId)
        .send({ email: 'late@example.com' }),
    ).expect(201);
    const token = (invite.body.inviteUrl as string).split('/').pop()!;

    await prisma.invitation.updateMany({
      where: { email: 'late@example.com', workspaceId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await agent().get(`/api/invitations/${token}`).expect(400);
  });

  it('rotates tokens on refresh and revokes them on logout', async () => {
    const refreshed = await authed(agent().post('/api/auth/refresh')).expect(
      200,
    );
    const newCookies = (refreshed.get('Set-Cookie') ?? []).map(
      (cookie: string) => cookie.split(';')[0],
    );
    expect(newCookies.some((c) => c.startsWith('access_token='))).toBe(true);

    // The old refresh token was rotated out — reusing it revokes the session.
    const oldCookies = [...cookies];
    cookies = newCookies;
    await agent()
      .post('/api/auth/refresh')
      .set('Cookie', oldCookies)
      .expect(401);

    // Fresh session again for cleanup, since reuse detection revoked ours.
    const again = await agent().post('/api/auth/guest').expect(201);
    const againCookies = (again.get('Set-Cookie') ?? []).map(
      (cookie: string) => cookie.split(';')[0],
    );
    await agent()
      .post('/api/auth/logout')
      .set('Cookie', againCookies)
      .expect(200);
    await agent().get('/api/auth/me').set('Cookie', againCookies).expect(401);
    // Remove that throwaway guest directly.
    const email = again.body.email as string;
    await prisma.user.delete({ where: { email } });
  });
});
