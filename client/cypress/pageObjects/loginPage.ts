/// <reference types="cypress" />
import {
  LOGINPAGE_URL,
  REGISTERPAGE_URL,
  HOMEPAGE_URL,
} from "../support/utils";

const loginPage = {
  url: LOGINPAGE_URL,

  clickRegister: () => {
    cy.get('[id="register-redirect"]').focus().click();
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
  acceptAlertValid: () => {
    cy.on("window:confirm", (text) => {
      expect(text).to.contain("Login successful!");
      return true; // simula click su OK
    });
  },
  acceptAlertNotValid: () => {
    cy.on("window:confirm", (text) => {
      expect(text).to.contain("Invalid username or password");
      return true; // simula click su OK
    });
  },
  clickHomepage: () => {
    cy.get('[id="go-to-homepage-button"]').click();
  }
};

export { loginPage };
