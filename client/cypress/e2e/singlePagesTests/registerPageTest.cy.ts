import { REGISTERPAGE_URL, LOGINPAGE_URL, CONFIRMPAGE_URL } from '../../support/utils';
import { registerPage } from '../../pageObjects/registerPage';
import { generateRandomString } from '../../pageObjects/utils';

describe('3. Test suite for register page :', () => {
	
	it('3.1 Inserting correct fields should lead to a correct registration process and confirm code page', () => {
		cy.visit(REGISTERPAGE_URL);
		const fn = generateRandomString(15);
		const ln = generateRandomString(15);
		const un = generateRandomString(10);
		const email = generateRandomString(10) + '@partest.' + generateRandomString(4);
		const pwd = generateRandomString(10);
		registerPage.insertFirstName(fn);
		registerPage.insertLastName(ln);
		registerPage.insertUsername(un);
		registerPage.insertEmail(email);
		registerPage.insertPassword(pwd);
		registerPage.insertTelegram('@' + generateRandomString(8));
		registerPage.toggleEmailNotifications();
		registerPage.submitForm();
		cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible');
		cy.url().should('equal', CONFIRMPAGE_URL);
	});

	it('3.2 Inserting already used credentials should lead to wrong registration (error) and should NOT lead to login page', () => {
		cy.visit(REGISTERPAGE_URL);
		const fn = generateRandomString(15);
		const ln = generateRandomString(15);
		const un = 'giack.team5';
		const email = 'giack@team.five';
		const pwd = generateRandomString(10);
		registerPage.insertFirstName(fn);
		registerPage.insertLastName(ln);
		registerPage.insertUsername(un);
		registerPage.insertEmail(email);
		registerPage.insertPassword(pwd);
		registerPage.submitForm();
		cy.get('.e2e-toast-error', { timeout: 5000 }).should('be.visible');
		cy.url().should('equal', REGISTERPAGE_URL);
	});

	it('3.3 Clicking on Log in link should lead to login page', () => {
		cy.visit(REGISTERPAGE_URL);
		registerPage.clickLogin();
		cy.url().should('equal', LOGINPAGE_URL);
	})

	it('3.4 Register works without optional fields', () => {
		cy.visit(REGISTERPAGE_URL);
		const fn = generateRandomString(12);
		const ln = generateRandomString(12);
		const un = generateRandomString(9);
		const email = generateRandomString(8) + '@partest.' + generateRandomString(3);
		const pwd = generateRandomString(10);
		registerPage.insertFirstName(fn);
		registerPage.insertLastName(ln);
		registerPage.insertUsername(un);
		registerPage.insertEmail(email);
		registerPage.insertPassword(pwd);
		registerPage.submitForm();
		cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible');
		cy.url().should('equal', CONFIRMPAGE_URL);
	});

	it('3.5 Register fails without required fields', () => {
		cy.visit(REGISTERPAGE_URL);
		const fn = generateRandomString(12);
		const ln = generateRandomString(12);
		const pwd = generateRandomString(8);
		registerPage.insertFirstName(fn);
		registerPage.insertLastName(ln);
		registerPage.insertPassword(pwd);
		registerPage.submitForm();
		cy.get('.e2e-toast-error', { timeout: 5000 }).should('be.visible');
		cy.url().should('equal', REGISTERPAGE_URL);
	});
});
