import { UPLOADREPORTPAGE_URL, HOMEPAGE_URL, LOGINPAGE_URL } from "../../support/utils";
import { reportPage } from "../../pageObjects/reportPage";
import { loginPage } from "../../pageObjects/loginPage";
import { homePage } from "../../pageObjects/homePage";
import { generateRandomString } from "../../pageObjects/utils";

const makeToken = (user: any) => {
	const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
	const exp = Math.floor(Date.now() / 1000) + 3600;
	const payload = btoa(JSON.stringify({ user, exp }));
	return `${header}.${payload}.`;
};

const stubLoginCitizen = () => {
	cy.intercept('POST', '/api/users/login', (req) => {
		const token = makeToken({
			id: 1,
			username: 'user',
			email: 'user@example.test',
			firstName: 'User',
			lastName: 'Test',
			userType: 'CITIZEN',
			emailNotificationsEnabled: true
		});
		req.reply({ statusCode: 200, body: { message: 'Login successful', token } });
	}).as('loginCitizen');
};

const stubCategories = () => {
	cy.intercept('GET', '/api/categories', {
		statusCode: 200,
		body: { categories: [
			{ id: 1, name: 'Road' },
			{ id: 2, name: 'Lighting' },
			{ id: 3, name: 'Trash' }
		]}
	}).as('getCategories');
};

const stubUploadSigningAndCloudinary = () => {
	cy.intercept('POST', '/api/uploads/sign', {
		statusCode: 200,
		body: {
			cloudName: 'demo',
			apiKey: '123456',
			timestamp: Math.floor(Date.now()/1000),
			signature: 'fake-signature',
			defaultFolder: 'tests'
		}
	}).as('signUpload');

	cy.intercept('POST', /https:\/\/api\.cloudinary\.com\/v1_1\/.*\/image\/upload/, {
		statusCode: 200,
		body: { secure_url: 'https://res.cloudinary.com/demo/image/upload/fake.png' }
	}).as('cloudinaryUpload');
};

const stubCreateReport = () => {
	cy.intercept('POST', '/api/reports', {
		statusCode: 200,
		body: { message: 'Report successfully created!' }
	}).as('createReport');
};

const performLoginAsCitizen = () => {
	stubLoginCitizen();
	cy.visit(LOGINPAGE_URL);
	loginPage.insertUsername('user');
	loginPage.insertPassword('user');
	loginPage.submitForm();
	cy.wait('@loginCitizen');
	cy.url().should('equal', HOMEPAGE_URL);
};

describe("4. Test suite for report page :", () => {
	it("4.1 As a logged user (citizen) i should be able to insert datas and upload a new report", () => {
		performLoginAsCitizen();
		stubCategories();
		stubUploadSigningAndCloudinary();
		stubCreateReport();
		
		const t = generateRandomString(10);
		const d = generateRandomString(20);
		
		homePage.clickNewReport();
		cy.url().should('equal', UPLOADREPORTPAGE_URL);
		
		reportPage.clickRandomOnMap();
		reportPage.insertTitle(t);
		reportPage.insertDescription(d);
		reportPage.selectCategory(3);
		reportPage.insertImages(1);
		reportPage.submitForm();
		
		cy.wait(['@signUpload', '@cloudinaryUpload', '@createReport']);
		cy.url().should('equal', HOMEPAGE_URL);
	});

	it('4.2 As a logged user (citizen) i shouldn\'t be able to upload a new report if one or more fields are not inserted ', () => {
		performLoginAsCitizen();
		stubCategories();
		
		const t = generateRandomString(10);
		const d = generateRandomString(20);
		
		homePage.clickNewReport();
		cy.url().should('equal', UPLOADREPORTPAGE_URL);
		
		reportPage.clickOnMap();
		reportPage.insertTitle(t);
		reportPage.insertDescription(d);
		reportPage.selectCategory(3);
		reportPage.submitFormNotVisible(); //we check that the upload button should NOT be clickable (it should be disabled)
	});

	it('4.3 Shows validation error when required fields missing', () => {
		performLoginAsCitizen();
		stubCategories();
		homePage.clickNewReport();
		cy.url().should('equal', UPLOADREPORTPAGE_URL);
		// Don\'t click map or fill anything
		reportPage.submitFormNotVisible();
	});
});
