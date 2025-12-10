import { HOMEPAGE_URL, LOGINPAGE_URL, UPLOADREPORTPAGE_URL, REGISTERPAGE_URL } from "../../support/utils";
import { homePage } from "../../pageObjects/homePage";
import { loginPage } from "../../pageObjects/loginPage";

const makeToken = (user: any) => {
	const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
	const exp = Math.floor(Date.now() / 1000) + 3600;
	const payload = btoa(JSON.stringify({ user, exp }));
	return `${header}.${payload}.`;
};

const stubReportsEndpoints = () => {
	const emptyList: any[] = [];
	
	cy.intercept('GET', /\/api\/reports\?status=Assigned.*/, { statusCode: 200, body: { reports: emptyList } }).as('reportsAssigned');
	cy.intercept('GET', /\/api\/reports\?status=InProgress.*/, { statusCode: 200, body: { reports: emptyList } }).as('reportsInProgress');
	cy.intercept('GET', /\/api\/reports\?status=Suspended.*/, { statusCode: 200, body: { reports: emptyList } }).as('reportsSuspended');
	cy.intercept('GET', /\/api\/reports\?status=Resolved.*/, { statusCode: 200, body: { reports: emptyList } }).as('reportsResolved');
};

const performLoginAsCitizen = () => {
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

    stubReportsEndpoints();

	cy.visit(LOGINPAGE_URL);
	loginPage.insertUsername('user');
	loginPage.insertPassword('user');
	loginPage.submitForm();
	cy.wait('@loginCitizen');
	// cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'Welcome user!');
	cy.url().should('equal', HOMEPAGE_URL);
};

describe("3. Test suite for home page :", () => {
	beforeEach(() => {
		cy.intercept('GET', '/api/users/me', { statusCode: 401, body: { message: 'Unauthorized' } }).as('meUnauthorized');
	});
	
	it("3.1 Login button should lead to right login page", () => {
		cy.visit(HOMEPAGE_URL);
		homePage.clickLogin();
		cy.url().should("equal", LOGINPAGE_URL);
	});

	it("3.2 Login link should lead to right login page", () => {
		cy.visit(HOMEPAGE_URL);
		homePage.clickLogin2();
		cy.url().should("equal", LOGINPAGE_URL);
	});
	
	it("3.3 As a logged user i should be able to click the map and select a location (identified b latitude and longitude)", () => {
		performLoginAsCitizen();
		
		cy.wait(['@reportsAssigned', '@reportsInProgress', '@reportsSuspended', '@reportsResolved']);
		cy.get('[alt="Marker"]').should('not.exist');
		homePage.clickOnMap();
		cy.get('[alt="Marker"]').should('be.visible');
	});

	it("3.4 As a logged user i should be able to go onto the upload a new report page", () => {
		performLoginAsCitizen();
		homePage.clickNewReport();
		cy.url().should("equal", UPLOADREPORTPAGE_URL);
	});

	it("3.5 As a logged user (citizen) I should be able to open notifications dropdown", () => {
		performLoginAsCitizen();
		homePage.clickNotifications();
	});

	it("3.6 Register link should lead to right register page when not logged", () => {
		cy.visit(HOMEPAGE_URL);
		homePage.clickRegister();
		cy.url().should("equal", REGISTERPAGE_URL);
	});
});