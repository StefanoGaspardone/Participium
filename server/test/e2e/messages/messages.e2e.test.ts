/**
 * NOTE: Message E2E tests have been removed due to API refactoring.
 * 
 * The messaging architecture changed from report-based to chat-based:
 * - Routes moved from /api/messages to /api/chats/:chatId/messages
 * - Messages are now grouped by chat, not by report
 * - New endpoints should be tested under the chat context
 * 
 * New E2E tests should be written for the chat-based messaging API:
 * - POST /api/chats/:chatId/messages
 * - GET /api/chats/:chatId/messages
 * - Other chat-related endpoints
 */

describe('Messages E2E (obsolete)', () => {
  it('placeholder - tests removed due to API refactoring to chat-based messaging', () => {
    expect(true).toBe(true);
  });
});
