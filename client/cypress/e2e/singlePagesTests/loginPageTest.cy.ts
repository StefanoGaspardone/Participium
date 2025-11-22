import {
  LOGINPAGE_URL,
  REGISTERPAGE_URL,
  HOMEPAGE_URL,
  ADMINPAGE_URL,
  TSMPAGE_URL,
  PUBRELOFFPAGE_URL,
  MUNADMPAGE_URL,
} from "../../support/utils";
import { loginPage } from "../../pageObjects/loginPage";

describe("2. Test suite for login page :", () => {
  it("2.1 Register button should lead to right register page", () => {
    cy.visit(LOGINPAGE_URL);
    loginPage.clickRegister();
    cy.url().should("equal", REGISTERPAGE_URL);
  });

  it("2.2 Logging in as a citizen should lead to homepage", () => {
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

  it("2.5 Logging in as an admin should lead to admin page", () => {
    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername('admin');
    loginPage.insertPassword('admin');
    loginPage.submitForm();
    loginPage.acceptAlertValid();
    cy.url().should("equal", ADMINPAGE_URL);
  });

  it("2.6 Logging in as a Technical Staff Member should lead to Techincal Staff page", () => {
    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername('tsm1');
    loginPage.insertPassword('password');
    loginPage.submitForm();
    loginPage.acceptAlertValid();
    cy.url().should("equal", TSMPAGE_URL);
  });
  
  it.skip("2.7 Logging in as a Municipal Administrator should lead to ???", () => {
    loginPage.insertUsername('munadm');
    loginPage.insertPassword('password');
    loginPage.submitForm();
    loginPage.acceptAlertValid();
    cy.url().should("equal", MUNADMPAGE_URL);
  });

  it("2.8 Logging in as a Public Relations Officer should lead to Public Relations Officer page", () => {
    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername('pro');
    loginPage.insertPassword('password');
    loginPage.submitForm();
    loginPage.acceptAlertValid();
    cy.url().should("equal", PUBRELOFFPAGE_URL);
  });
});
