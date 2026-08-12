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
      const [tasks, projects] = await Promise.all([
        prisma.task.count({ where: { ownerId: user.id } }),
        prisma.project.count({ where: { ownerId: user.id } }),
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
    const created = await authed(
      agent().post('/api/tasks').send({
        title: 'E2E smoke task',
        priority: 'MEDIUM',
        status: 'TODO',
      }),
    ).expect(201);
    createdTaskId = created.body.id;

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
        .send({ status: 'DOING', position: 42 }),
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
