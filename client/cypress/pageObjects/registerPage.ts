/// <reference types="cypress" />
import { REGISTERPAGE_URL } from '../support/utils';

const registerPage = {
	url: REGISTERPAGE_URL,

	insertFirstName: (fn: string) => {
		cy.get('[id="first-name"]').click().type(fn);
	},

	insertLastName: (ln: string) => {
		cy.get('[id="last-name"]').click().type(ln);
	},

	insertUsername: (un: string) => {
		cy.get('[id="username"]').click().type(un);
	},
	
	insertEmail: (e: string) => {
		cy.get('[id="email"]').click().type(e);
	},
	
	insertPassword: (pwd: string) => {
		cy.get('[id="password"]').click().type(pwd);
	},

	insertTelegram: (tg: string) => {
		cy.get('[id="tg_username"]').click().clear().type(tg);
	},

	uploadProfilePic: (filePath: string) => {
		cy.get('[id="image"]').selectFile(filePath, { force: true });
	},

	toggleEmailNotifications: () => {
		cy.contains('Receive email notifications').click();
	},
	
	submitForm: () => {
		cy.get('[id="submit-button"]').click();
	},
	
	clickLogin: () => {
		cy.get('[id="login-redirect"]').click();
	}
};

export { registerPage };
