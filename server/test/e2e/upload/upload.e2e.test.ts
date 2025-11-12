import * as lifecycle from '@test/e2e/lifecycle'
import { app } from '@app'
import request from 'supertest'
import { getCloudinaryConfig, signParams } from '@utils/cloudinary'

describe('Upload E2E tests', () => {
	beforeAll(async () => {
		await lifecycle.default.beforeAll()
	})

	afterAll(async () => {
		await lifecycle.default.afterAll()
	})

	it('POST /api/uploads/sign should return signing payload and valid signature', async () => {
		const res = await request(app).post('/api/uploads/sign').send()
		expect(res.status).toBe(200)
		expect(res.body).toHaveProperty('cloudName')
		expect(res.body).toHaveProperty('apiKey')
		expect(res.body).toHaveProperty('timestamp')
		expect(typeof res.body.timestamp).toBe('number')
		expect(res.body).toHaveProperty('signature')

		// Recompute signature using the same utils and ensure it matches
		const cfg = getCloudinaryConfig()
		const paramsToSign: Record<string, string | number> = { timestamp: res.body.timestamp }
		if (cfg.defaultFolder) paramsToSign.folder = cfg.defaultFolder
		if (cfg.uploadPreset) paramsToSign.upload_preset = cfg.uploadPreset

		const expected = signParams(paramsToSign, cfg.apiSecret)
		expect(res.body.signature).toBe(expected)
		// signature should be a 40-char hex (sha1)
		expect(String(res.body.signature)).toMatch(/^[a-f0-9]{40}$/)
	})
})

