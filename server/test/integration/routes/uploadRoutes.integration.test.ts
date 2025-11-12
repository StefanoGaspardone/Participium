import request from 'supertest'
import { app } from '@app'

// Mock the UploadService used by the controller underlying the route
jest.mock('@services/UploadService', () => ({
	UploadService: class UploadService {},
	uploadService: {
		sign: jest.fn(async () => ({
			cloudName: 'route-cloud',
			apiKey: 'route-key',
			timestamp: 1700000000,
			defaultFolder: 'route-folder',
			uploadPreset: 'route-preset',
			signature: 'route-signature',
		})),
	},
}))

describe('Upload routes (integration)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('POST /api/uploads/sign should return 200 and the signing payload', async () => {
		const res = await request(app).post('/api/uploads/sign').send()

		expect(res.status).toBe(200)
		const mod = require('@services/UploadService') as any
		expect(mod.uploadService.sign).toHaveBeenCalled()
		expect(res.body).toMatchObject({
			cloudName: 'route-cloud',
			apiKey: 'route-key',
			defaultFolder: 'route-folder',
			uploadPreset: 'route-preset',
			signature: 'route-signature',
		})
		expect(typeof res.body.timestamp).toBe('number')
	})

	it('POST /api/uploads/sign should return 500 when uploadService.sign throws', async () => {
		const mod = require('@services/UploadService') as any
		;(mod.uploadService.sign as jest.Mock).mockImplementationOnce(async () => { throw new Error('boom') })

		const res = await request(app).post('/api/uploads/sign').send()

		expect(res.status).toBe(500)
		expect(res.body).toHaveProperty('code', 500)
		expect(res.body).toHaveProperty('message', 'boom')
		expect(res.body).toHaveProperty('name')
	})

		it('should return 500 when uploadService.sign rejects with non-Error value', async () => {
			const mod = require('@services/UploadService') as any
			;(mod.uploadService.sign as jest.Mock).mockImplementationOnce(async () => { throw 'str error' })

			const res = await request(app).post('/api/uploads/sign').send()

			expect(res.status).toBe(500)
			expect(res.body).toHaveProperty('code', 500)
			// message may be the string forwarded by createAppError
			expect(res.body).toHaveProperty('message')
		})
})

