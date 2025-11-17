import {
  REGISTERPAGE_URL,
  LOGINPAGE_URL,
  HOMEPAGE_URL,
} from "../support/utils";

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
  submitForm: () => {
    cy.get('[id="submit-button"]').click();
  },
  acceptAlertValid: () => {
    cy.on("window:confirm", (text) => {
      expect(text).to.contain("Registration completed successfully!");
      return true; // simula click su OK
    });
  },
  acceptAlertNotValid: () => {
    cy.on("window:confirm", (text) => {
      expect(text).to.contain("Email or username already exists");
      return true; // simula click su OK
    });
  },
  clickLogin: () => {
    cy.get('[id="login-redirect"]').click();
  }
};

export { registerPage };
