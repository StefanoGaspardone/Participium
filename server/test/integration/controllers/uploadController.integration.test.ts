import { uploadController } from '@controllers/UploadController'

// Mock the UploadService module used by the controller
jest.mock('@services/UploadService', () => ({
	UploadService: class UploadService {},
	uploadService: {
		sign: jest.fn(async () => ({
			cloudName: 'int-cloud',
			apiKey: 'int-key',
			timestamp: 1600000000,
			defaultFolder: 'int-folder',
			uploadPreset: 'int-preset',
			signature: 'int-signature',
		})),
	},
}))

describe('UploadController (integration)', () => {
	it('should respond with 200 and JSON payload from uploadService.sign', async () => {
		const req: any = {}
		const json = jest.fn()
		const status = jest.fn(() => ({ json }))
		const res: any = { status }
		const next = jest.fn()

		await uploadController.sign(req, res, next)

		expect(status).toHaveBeenCalledWith(200)
		expect(json).toHaveBeenCalledWith(expect.objectContaining({ cloudName: 'int-cloud', apiKey: 'int-key' }))
		expect(next).not.toHaveBeenCalled()
	})

	it('should call next when uploadService.sign throws', async () => {
		const { uploadService } = require('@services/UploadService') as any
		;(uploadService.sign as jest.Mock).mockImplementationOnce(async () => { throw new Error('boom') })

		const req: any = {}
		const json = jest.fn()
		const status = jest.fn(() => ({ json }))
		const res: any = { status }
		const next = jest.fn()

		await uploadController.sign(req, res, next)

		expect(next).toHaveBeenCalled()
		const err = (next as jest.Mock).mock.calls[0][0]
		expect(err).toBeInstanceOf(Error)
		expect(err.message).toBe('boom')
		expect(status).not.toHaveBeenCalled()
	})

	it('should forward thrown non-Error values to next', async () => {
		const { uploadService } = require('@services/UploadService') as any
		;(uploadService.sign as jest.Mock).mockImplementationOnce(async () => { throw 'string error' })

		const req: any = {}
		const json = jest.fn()
		const status = jest.fn(() => ({ json }))
		const res: any = { status }
		const next = jest.fn()

		await uploadController.sign(req, res, next)

		expect(next).toHaveBeenCalled()
		const err = (next as jest.Mock).mock.calls[0][0]
		expect(err).toBe('string error')
	})
})

