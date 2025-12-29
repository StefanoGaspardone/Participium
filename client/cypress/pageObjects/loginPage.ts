/// <reference types="cypress" />

import { LOGINPAGE_URL } from '../support/utils';

const loginPage = {
  	url: LOGINPAGE_URL,

	clickRegister: () => {
		cy.get('[id="register-redirect"]').focus().click();
	},

	clickConfirmCode: () => {
		// span is not focusable; click directly
		cy.get('[id="code-confirm-redirect"]').click();
	},

	insertUsername: (username: string) => {
		cy.get('[id="username"]').clear();
		cy.get('[id="username"]').type(username);
	},

	insertPassword: (pwd: string) => {
		cy.get('[id="password"]').clear();
		cy.get('[id="password"]').type(pwd);
	},

	submitForm: () => {
		cy.get('[id="submit-button"]').click();
	},

	clickHomepage: () => {
		cy.get('[id="login-1"]').click();
	}
};

export { loginPage };