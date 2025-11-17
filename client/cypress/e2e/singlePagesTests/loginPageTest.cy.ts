import {
  LOGINPAGE_URL,
  REGISTERPAGE_URL,
  HOMEPAGE_URL,
} from "../../support/utils";
import { loginPage } from "../../pageObjects/loginPage";

describe("2. Test suite for homepage tests :", () => {
  it("2.1 Register button should lead to right register page", () => {
    cy.visit(LOGINPAGE_URL);
    loginPage.clickRegister();
    cy.url().should("equal", REGISTERPAGE_URL);
  });

  it("2.2 Inserting existing credentials should lead to login page + logged user", () => {
    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername("giack.team5");
    loginPage.insertPassword("password");
    loginPage.submitForm();
    loginPage.acceptAlertValid();
    cy.url().should("equal", HOMEPAGE_URL);
  });

  it("2.3 Inserting wrong credentials should lead to an error and NOT redirecting to other pages", () => {
    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername("wrong-username");
    loginPage.insertPassword("password-wrong");
    loginPage.submitForm();
    loginPage.acceptAlertValid();
    cy.url().should("equal", LOGINPAGE_URL);
  });

  it("2.4 Clicking on homepage button should correctly redirect to homepage", () => {
    cy.visit(LOGINPAGE_URL);
    loginPage.clickHomepage();
    cy.url().should("equal", HOMEPAGE_URL);
  });
});
