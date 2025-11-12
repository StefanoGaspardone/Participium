import { uploadService } from '@services/UploadService'

// Mock the cloudinary utilities module
jest.mock('@utils/cloudinary', () => ({
	getCloudinaryConfig: jest.fn(() => ({
		cloudName: 'demo-cloud',
		apiKey: '12345',
		apiSecret: 'secret',
		uploadPreset: 'preset1',
		defaultFolder: 'folderA',
	})),
	signParams: jest.fn((params: Record<string, string | number>, secret: string) => {
		return `signed-${Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')}-${secret}`;
	}),
}))

describe('UploadService.sign', () => {
    it('should return cloudinary signing data with expected fields and computed signature', async () => {
	    const result = await uploadService.sign()

		expect(result).toBeDefined()
		expect(result).toHaveProperty('cloudName', 'demo-cloud')
		expect(result).toHaveProperty('apiKey', '12345')
		expect(result).toHaveProperty('timestamp')
		expect(typeof result.timestamp).toBe('number')
		expect(result).toHaveProperty('defaultFolder', 'folderA')
		expect(result).toHaveProperty('uploadPreset', 'preset1')
		expect(result).toHaveProperty('signature')

		expect(String(result.signature)).toContain('folder=folderA')
		expect(String(result.signature)).toContain('upload_preset=preset1')
	})

		it('should call signParams with only timestamp when no folder or upload preset configured', async () => {
			const cloudMod = require('@utils/cloudinary') as any
			// clear previous signParams mock calls so we only assert the current invocation
			cloudMod.signParams.mockClear()
			// set mock to return no folder/upload preset
			cloudMod.getCloudinaryConfig.mockImplementationOnce(() => ({
				cloudName: 'demo-cloud',
				apiKey: '12345',
				apiSecret: 'secret',
				uploadPreset: undefined,
				defaultFolder: undefined,
			}))

			const result = await uploadService.sign()
			expect(result).toBeDefined()
			expect(result).toHaveProperty('signature')

			// signParams should have been called once with only timestamp in params
			expect(cloudMod.signParams).toHaveBeenCalled()
			const callArgs = cloudMod.signParams.mock.calls[0]
			const paramsArg = callArgs[0]
			expect(Object.keys(paramsArg)).toEqual(expect.arrayContaining(['timestamp']))
			expect(paramsArg).not.toHaveProperty('folder')
			expect(paramsArg).not.toHaveProperty('upload_preset')
		})

		it('should propagate errors when cloudinary config retrieval fails', async () => {
			const cloudMod = require('@utils/cloudinary') as any
			cloudMod.getCloudinaryConfig.mockImplementationOnce(() => { throw new Error('missing env') })

			await expect(uploadService.sign()).rejects.toThrow('missing env')
		})
})

