import { LOGINPAGE_URL, REGISTERPAGE_URL, HOMEPAGE_URL, ADMINPAGE_URL, TSMPAGE_URL, PUBRELOFFPAGE_URL, MUNADMPAGE_URL, CONFIRMPAGE_URL } from '../../support/utils';
import { loginPage } from '../../pageObjects/loginPage';
import { registerPage } from '../../pageObjects/registerPage';
import { generateRandomString } from '../../pageObjects/utils';

describe('2. Test suite for login page :', () => {
	it('2.1 Register button should lead to right register page', () => {
		cy.visit(LOGINPAGE_URL);
		loginPage.clickRegister();
		cy.url().should('equal', REGISTERPAGE_URL);
  	});
	
	it('2.2 Confirm code button should lead to right confirm code page', () => {
		cy.visit(LOGINPAGE_URL);
		loginPage.clickConfirmCode();
		cy.url().should('equal', CONFIRMPAGE_URL);
  	});

	it('2.3 Logging in as a citizen should lead to homepage', () => {
		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername('user');
		loginPage.insertPassword('user');
		loginPage.submitForm();
		cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'Welcome user!');
		cy.url().should('equal', HOMEPAGE_URL);
	});

	it('2.4 Inserting wrong credentials should lead to an error and NOT redirecting to other pages', () => {
		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername('wrong-username');
		loginPage.insertPassword('password-wrong');
		loginPage.submitForm();
		cy.get('.e2e-toast-error', { timeout: 5000 }).should('be.visible');
		cy.url().should('equal', LOGINPAGE_URL);
	});

	it('2.5 Clicking on homepage button should correctly redirect to homepage', () => {
		cy.visit(LOGINPAGE_URL);
		loginPage.clickHomepage();
		cy.url().should('equal', HOMEPAGE_URL);
	});

	it('2.6 Logging in as an admin should lead to admin page', () => {
		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername('admin');
		loginPage.insertPassword('admin');
		loginPage.submitForm();
		cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'Welcome admin!');
		cy.url().should('equal', ADMINPAGE_URL);
	});

	it('2.7 Logging in as a Technical Staff Member should lead to Techincal Staff page', () => {
		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername('tsm1');
		loginPage.insertPassword('password');
		loginPage.submitForm();
		cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'Welcome tsm1!');
		cy.url().should('equal', TSMPAGE_URL);
	});
  
	it.skip('2.8 Logging in as a Municipal Administrator should lead to ???', () => {
		loginPage.insertUsername('munadm');
		loginPage.insertPassword('password');
		loginPage.submitForm();
		cy.url().should('equal', MUNADMPAGE_URL);
	});

	it('2.9 Logging in as a Public Relations Officer should lead to Public Relations Officer page', () => {
		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername('pro');
		loginPage.insertPassword('password');
		loginPage.submitForm();
		cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'Welcome pro!');
		cy.url().should('equal', PUBRELOFFPAGE_URL);
	});


	it('2.10 Login fails for not-activated user after registration', () => {
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
		cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible');
		cy.url().should('equal', CONFIRMPAGE_URL);

		cy.visit(LOGINPAGE_URL);
		loginPage.insertUsername(un);
		loginPage.insertPassword(pwd);
		loginPage.submitForm();
		cy.get('.e2e-toast-error', { timeout: 5000 }).should('be.visible');
		cy.url().should('equal', LOGINPAGE_URL);
	});
});
