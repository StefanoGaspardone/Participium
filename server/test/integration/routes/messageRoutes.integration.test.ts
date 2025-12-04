import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';

/**
 * NOTE: Message routes have been refactored to use chat-based architecture.
 * 
 * Old routes (removed):
 * - POST /api/messages
 * - GET /api/messages/report/:id
 * - GET /api/messages
 * 
 * New routes (in chat.routes.ts):
 * - POST /api/chats/:chatId/newMessage
 * - GET /api/chats/:chatId/messages
 * - GET /api/chats (for listing user's chats)
 * 
 * These tests have been removed as the routes no longer exist.
 * Integration tests for chat routes should be created in a separate file.
 */

describe('Message routes integration tests', () => {
  beforeAll(async () => {
    await initializeTestDatasource();
    await emptyTestData();
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('placeholder - message routes migrated to chat routes', () => {
    expect(true).toBe(true);
  });
});

    it('should return 401 without authentication token', async () => {
      const newMessage = {
        text: 'Unauthorized message',
        receiverId: techStaffUser.id,
        reportId: testReport.id,
      };

      const res = await request(app).post('/api/messages').send(newMessage);

      expect(res.status).toBe(401);
    });

    it('should return 400 when text is missing', async () => {
      const incompleteMessage = {
        receiverId: techStaffUser.id,
        reportId: testReport.id,
      };

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(incompleteMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/text is required/);
    });

    it('should return 400 when receiverId is missing', async () => {
      const incompleteMessage = {
        text: 'Test message',
        reportId: testReport.id,
      };

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(incompleteMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/receiverId is required/);
    });

    it('should return 400 when reportId is missing', async () => {
      const incompleteMessage = {
        text: 'Test message',
        receiverId: techStaffUser.id,
      };

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(incompleteMessage);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/reportId is required/);
    });
  });

  describe('GET /api/messages/report/:id', () => {
    it('should return messages for valid report ID with citizen token', async () => {
      const res = await request(app)
        .get(`/api/messages/report/${testReport.id}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
    });

    it('should return messages for valid report ID with tech staff token', async () => {
      const res = await request(app)
        .get(`/api/messages/report/${testReport.id}`)
        .set('Authorization', `Bearer ${techStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
    });

    it('should return 401 without authentication token', async () => {
      const res = await request(app).get(`/api/messages/report/${testReport.id}`);

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid report ID', async () => {
      const res = await request(app)
        .get('/api/messages/report/invalid')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid report ID');
    });
  });

  describe('GET /api/messages', () => {
    it('should return chats for authenticated citizen user', async () => {
      const res = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chats');
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it('should return chats for authenticated tech staff user', async () => {
      const res = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${techStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chats');
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it('should return 401 without authentication token', async () => {
      const res = await request(app).get('/api/messages');

      expect(res.status).toBe(401);
    });
  });
});
