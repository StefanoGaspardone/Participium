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
		cy.get('[id="username"]').focus().clear().type(username);
	},

	insertPassword: (pwd: string) => {
		cy.get('[id="password"]').focus().clear().type(pwd);
	},

	submitForm: () => {
		cy.get('[id="submit-button"]').focus().click();
	},

	clickHomepage: () => {
		cy.get('[id="login-1"]').click();
	}
};

export { loginPage };