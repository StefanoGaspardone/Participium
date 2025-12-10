import { LOGINPAGE_URL, REGISTERPAGE_URL, HOMEPAGE_URL, ADMINPAGE_URL, TSMPAGE_URL, PUBRELOFFPAGE_URL, MUNADMPAGE_URL, CONFIRMPAGE_URL, MAINTAINERPAGE_URL } from '../../support/utils';
import { loginPage } from '../../pageObjects/loginPage';
import { registerPage } from '../../pageObjects/registerPage';
import { generateRandomString } from '../../pageObjects/utils';

describe('4. Test suite for login page :', () => {
	const makeToken = (user: any) => {
		const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
		const exp = Math.floor(Date.now() / 1000) + 3600;
		const payload = btoa(JSON.stringify({ user, exp }));
		return `${header}.${payload}.`;
	};

	beforeEach(() => {
		cy.intercept('POST', '/api/users/me', {
			statusCode: 401,
			body: { message: 'Unauthorized' }
		}).as('me');
	});

	it('4.1 Register button should lead to right register page', () => {
		cy.visit(LOGINPAGE_URL);
		loginPage.clickRegister();
		cy.url().should('equal', REGISTERPAGE_URL);
  	});
	
	it('4.2 Confirm code button should lead to right confirm code page', () => {
		cy.visit(LOGINPAGE_URL);
		loginPage.clickConfirmCode();
		cy.url().should('equal', CONFIRMPAGE_URL);
  	});

	it('4.3 Logging in as a citizen should lead to homepage', () => {
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

		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername('user');
		loginPage.insertPassword('user');
		loginPage.submitForm();
		cy.wait('@loginCitizen');
		// cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'Welcome user!');
		cy.url().should('equal', HOMEPAGE_URL);
	});

	it('4.4 Inserting wrong credentials should lead to an error and NOT redirecting to other pages', () => {
		cy.intercept('POST', '/api/users/login', {
			statusCode: 401,
			body: { message: 'Invalid username or password' }
		}).as('loginFail');

		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername('wrong-username');
		loginPage.insertPassword('password-wrong');
		loginPage.submitForm();
		cy.wait('@loginFail');
		// cy.get('.e2e-toast-error', { timeout: 5000 }).should('be.visible');
		cy.url().should('equal', LOGINPAGE_URL);
	});

	it('4.5 Clicking on homepage button should correctly redirect to homepage', () => {
		cy.visit(LOGINPAGE_URL);
		loginPage.clickHomepage();
		cy.url().should('equal', HOMEPAGE_URL);
	});

	it('4.6 Logging in as an admin should lead to admin page', () => {
		cy.intercept('POST', '/api/users/login', (req) => {
			const token = makeToken({
				id: 2,
				username: 'admin',
				email: 'admin@example.test',
				firstName: 'Admin',
				lastName: 'User',
				userType: 'ADMINISTRATOR',
				emailNotificationsEnabled: true
			});
			req.reply({ statusCode: 200, body: { message: 'Login successful', token } });
		}).as('loginAdmin');

		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername('admin');
		loginPage.insertPassword('admin');
		loginPage.submitForm();
		cy.wait('@loginAdmin');
		// cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'Welcome admin!');
		cy.url().should('equal', ADMINPAGE_URL);
	});

	it('4.7 Logging in as a Technical Staff Member should lead to Techincal Staff page', () => {
		cy.intercept('POST', '/api/users/login', (req) => {
			const token = makeToken({
				id: 3,
				username: 'tsm1',
				email: 'tsm1@example.test',
				firstName: 'TSM',
				lastName: 'One',
				userType: 'TECHNICAL_STAFF_MEMBER',
				emailNotificationsEnabled: true
			});
			req.reply({ statusCode: 200, body: { message: 'Login successful', token } });
		}).as('loginTSM');

		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername('tsm1');
		loginPage.insertPassword('password');
		loginPage.submitForm();
		cy.wait('@loginTSM');
		// cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'Welcome tsm1!');
		cy.url().should('equal', TSMPAGE_URL);
	});
  
	it.skip('4.8 Logging in as a Municipal Administrator should lead to ???', () => {
		loginPage.insertUsername('munadm');
		loginPage.insertPassword('password');
		loginPage.submitForm();
		cy.url().should('equal', MUNADMPAGE_URL);
	});

	it('4.9 Logging in as a Public Relations Officer should lead to Public Relations Officer page', () => {
		cy.intercept('POST', '/api/users/login', (req) => {
			const token = makeToken({
				id: 4,
				username: 'pro',
				email: 'pro@example.test',
				firstName: 'Pro',
				lastName: 'User',
				userType: 'PUBLIC_RELATIONS_OFFICER',
				emailNotificationsEnabled: true
			});
			req.reply({ statusCode: 200, body: { message: 'Login successful', token } });
		}).as('loginPRO');

		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername('pro');
		loginPage.insertPassword('password');
		loginPage.submitForm();
		cy.wait('@loginPRO');
		// cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'Welcome pro!');
		cy.url().should('equal', PUBRELOFFPAGE_URL);
	});

	it('4.10 Logging in as an External Maintainer should lead to External Maintainer page', () => {
		cy.intercept('POST', '/api/users/login', (req) => {
			const token = makeToken({
				id: 4,
				username: 'mnt',
				email: 'mnt@example.test',
				firstName: 'mnt',
				lastName: 'User',
				userType: 'EXTERNAL_MAINTAINER',
				emailNotificationsEnabled: true
			});
			req.reply({ statusCode: 200, body: { message: 'Login successful', token } });
		}).as('loginMNT');

		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername('mnt');
		loginPage.insertPassword('password');
		loginPage.submitForm();
		cy.wait('@loginMNT');
		// cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'Welcome pro!');
		cy.url().should('equal', MAINTAINERPAGE_URL);
	});

	it('4.11 Login fails for not-activated user after registration', () => {
		cy.intercept('POST', '/api/users/signup', { 
			statusCode: 201, 
			body: {} 
		}).as('signup');

		cy.visit(REGISTERPAGE_URL);
		const fn = generateRandomString(10);
		const ln = generateRandomString(10);
		const un = generateRandomString(8);
		const email = generateRandomString(8) + '@partest.test';
		const pwd = generateRandomString(10);
		registerPage.insertFirstName(fn);
		registerPage.insertLastName(ln);
		registerPage.insertUsername(un);
		registerPage.insertEmail(email);
		registerPage.insertPassword(pwd);
		registerPage.submitForm();
		cy.wait('@signup');
		// cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible');
		cy.url().should('equal', CONFIRMPAGE_URL);

		cy.intercept('POST', '/api/users/login', {
			statusCode: 400,
			body: { message: 'Account not activated. Please verify your email before logging in.' }
		}).as('loginNotActive');

		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername(un);
		loginPage.insertPassword(pwd);
		loginPage.submitForm();
		cy.wait('@loginNotActive');
		// cy.get('.e2e-toast-error', { timeout: 5000 }).should('be.visible');
		cy.url().should('equal', LOGINPAGE_URL);
	});
});
