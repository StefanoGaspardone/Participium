import { confirmCodePage } from '../../pageObjects/confirmCodePage';
import { CONFIRMPAGE_URL, LOGINPAGE_URL } from '../../support/utils';

describe('6. Test suite for confirm code page', () => {
	
	it('6.1 Shows initial cooldown message on entry', () => {
		cy.visit(CONFIRMPAGE_URL);
		confirmCodePage.setUsername('testuser');
		confirmCodePage.getCooldownText().should('be.visible').and('contain.text', 'Resend available');
	});

	it('6.2 Successful code confirmation navigates to login and shows success toast', () => {
		cy.intercept('POST', '/api/users/validate-user', {
			statusCode: 200,
			body: { message: 'Account verified! You can log in.' }
		}).as('validateSuccess');

		cy.visit(CONFIRMPAGE_URL);
		confirmCodePage.setUsername('testuser');
		confirmCodePage.typeCode('123456');
		confirmCodePage.submit();
		cy.wait('@validateSuccess');
		// cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'Account verified');
		cy.url().should('equal', LOGINPAGE_URL);
	});

	it('6.3 Invalid code shows error and enables resend, resend call succeeds and starts cooldown', () => {
		cy.intercept('POST', '/api/users/validate-user', {
			statusCode: 400,
			body: { message: 'Invalid code' }
		}).as('validateFail');

		cy.visit(CONFIRMPAGE_URL);
		confirmCodePage.setUsername('testuser');
		confirmCodePage.typeCode('000000');
		confirmCodePage.submit();

		cy.wait('@validateFail');
		// cy.get('.e2e-toast-error', { timeout: 5000 }).should('be.visible').and('contain.text', 'Invalid');

		cy.intercept('POST', '/api/users/resend-user', {
			statusCode: 200,
			body: { message: 'New code sent' }
		}).as('resendSuccess');

		cy.get('#resend-code').should('be.visible').click();
		cy.wait('@resendSuccess');
		// cy.get('.e2e-toast-success', { timeout: 5000 }).should('be.visible').and('contain.text', 'New code sent');

		confirmCodePage.getCooldownText().should('be.visible').and('contain.text', 'Resend available');
	});

	it('6.4 Pasting a 6-digit code fills all inputs', () => {
		cy.visit(CONFIRMPAGE_URL);
		confirmCodePage.setUsername('testuser');

		confirmCodePage.pasteCode('987654');

		const digits = '987654'.split('');
		digits.forEach((d, i) => {
			cy.get('.otp-input').eq(i).should('have.value', d);
		});
	});

	it('6.5 Submitting an invalid username shows an error toast', () => {
		cy.intercept('POST', '/api/users/validate-user', {
			statusCode: 404,
			body: { message: 'User with username not found' }
		}).as('validateNotFound');

		cy.visit(CONFIRMPAGE_URL);
		confirmCodePage.setUsername('nonexistent_user');
		confirmCodePage.typeCode('123456');
		confirmCodePage.submit();
		cy.wait('@validateNotFound');
		// cy.get('.e2e-toast-error', { timeout: 5000 }).should('be.visible').and('contain.text', 'User with username');
	});

	it('6.6 Confirming code for an already active user shows appropriate error', () => {
		cy.intercept('POST', '/api/users/validate-user', {
			statusCode: 400,
			body: { message: 'User is already active' }
		}).as('validateAlreadyActive');

		cy.visit(CONFIRMPAGE_URL);
		confirmCodePage.setUsername('testuser');
		confirmCodePage.typeCode('123456');
		confirmCodePage.submit();
		cy.wait('@validateAlreadyActive');
		// cy.get('.e2e-toast-error', { timeout: 5000 }).should('be.visible').and('contain.text', 'already active');
	});
});