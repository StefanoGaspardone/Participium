// Mock nodemailer before importing anything else
const mockVerify = jest.fn();
const mockSendMail = jest.fn();
const mockTransporter = {
	verify: mockVerify,
	sendMail: mockSendMail,
};

jest.mock('nodemailer', () => ({
	createTransport: jest.fn(() => mockTransporter),
}));

jest.mock('@utils/logger', () => ({
	logInfo: jest.fn(),
	logError: jest.fn(),
}));

jest.mock('@config', () => ({
	CONFIG: {
		MAIL: {
			SMTP_HOST: 'smtp.test.local',
			SMTP_PORT: 587,
			SMTP_USER: 'user',
			SMTP_PASS: 'pass',
			MAIL_FROM_ADDRESS: 'from@test.local',
			MAIL_FROM_NAME: 'Test Sender',
		},
		LOG: {
			LEVEL: 'info',
		},
	},
}));

describe('MailService (mock)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockVerify.mockReset();
		mockSendMail.mockReset();
	});

	describe('constructor', () => {
		it('should initialize transporter with correct SMTP configuration', async () => {
			mockVerify.mockResolvedValue(true);

			const nodemailer = require('nodemailer');
			const { MailService } = require('@services/MailService');
			const service = new MailService();

			// Wait for verify to be called
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(nodemailer.createTransport).toHaveBeenCalledWith(
				expect.objectContaining({
					host: 'smtp.test.local',
					port: 587,
					secure: false,
					auth: expect.objectContaining({
						user: 'user',
						pass: 'pass',
					}),
					pool: true,
					maxConnections: 5,
					rateDelta: 1000,
					maxMessages: 100,
					rateLimit: 1,
				})
			);
			expect(mockVerify).toHaveBeenCalled();
			expect(service).toBeDefined();
		});

		it('should create transporter when SMTP_PASS is provided', async () => {
			mockVerify.mockResolvedValue(true);

			const { MailService } = require('@services/MailService');
			const service = new MailService();

			// Wait for initialization
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(service.transporter).not.toBeNull();
		});

		it('should handle SMTP verification success', async () => {
			mockVerify.mockResolvedValue(true);

			const { MailService } = require('@services/MailService');
			const service = new MailService();

			// Wait for verify to be called
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockVerify).toHaveBeenCalled();
			expect(service).toBeDefined();
		});

		it('should handle SMTP verification failure and set transporter to null', async () => {
			mockVerify.mockRejectedValue(new Error('SMTP verification failed'));

			const { MailService } = require('@services/MailService');
			const service = new MailService();

			// Wait for verify to be called
			await new Promise(resolve => setTimeout(resolve, 50));

			expect(mockVerify).toHaveBeenCalled();
			expect(service.transporter).toBeNull();
		});
	});

	describe('sendMail', () => {
		it('should send email with correct parameters', async () => {
			mockVerify.mockResolvedValue(true);
			const mockInfo = {
				messageId: 'test-message-id',
				accepted: ['recipient@test.com'],
			};
			mockSendMail.mockResolvedValue(mockInfo);

			const { MailService } = require('@services/MailService');
			const service = new MailService();

			// Wait for transporter initialization
			await new Promise(resolve => setTimeout(resolve, 10));

			const mailOptions = {
				to: 'recipient@test.com',
				subject: 'Test Subject',
				text: 'Test message body',
			};

			const result = await service.sendMail(mailOptions);

			expect(mockSendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					from: expect.stringContaining('@'),
					to: 'recipient@test.com',
					subject: 'Test Subject',
					text: 'Test message body',
					html: 'Test message body',
				})
			);
			expect(result).toEqual(mockInfo);
		});

		it('should return early when transporter is null', async () => {
			mockVerify.mockResolvedValue(true);

			const { MailService } = require('@services/MailService');
			const service = new MailService();

			// Wait for initialization
			await new Promise(resolve => setTimeout(resolve, 10));

			// Manually set transporter to null to simulate the case where email is not configured
			(service).transporter = null;

			const mailOptions = {
				to: 'recipient@test.com',
				subject: 'Test Subject',
				text: 'Test message body',
			};

			const result = await service.sendMail(mailOptions);

			expect(mockSendMail).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should handle sendMail errors gracefully', async () => {
			mockVerify.mockResolvedValue(true);
			mockSendMail.mockRejectedValue(new Error('Failed to send email'));

			const { MailService } = require('@services/MailService');
			const service = new MailService();

			// Wait for transporter initialization
			await new Promise(resolve => setTimeout(resolve, 10));

			const mailOptions = {
				to: 'recipient@test.com',
				subject: 'Test Subject',
				text: 'Test message body',
			};

			const result = await service.sendMail(mailOptions);

			expect(mockSendMail).toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should format from address with name', async () => {
			mockVerify.mockResolvedValue(true);
			mockSendMail.mockResolvedValue({ messageId: 'test-id' });

			const { MailService } = require('@services/MailService');
			const service = new MailService();

			// Wait for transporter initialization
			await new Promise(resolve => setTimeout(resolve, 10));

			const mailOptions = {
				to: 'recipient@test.com',
				subject: 'Test Subject',
				text: 'Test message body',
			};

			await service.sendMail(mailOptions);

			expect(mockSendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					from: expect.stringMatching(/.+<.+@.+>/),
				})
			);
		});
	});
});