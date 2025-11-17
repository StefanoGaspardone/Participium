import {
  HOMEPAGE_URL,
  REGISTERPAGE_URL,
  LOGINPAGE_URL,
} from "../../support/utils";
import { registerPage } from "../../pageObjects/registerPage";
import { generateRandomString } from "../../pageObjects/utils";

describe("3. Test suite for registerpage tests :", () => {
  /** credentials are generated here, so that they are "fresh" for the first test, but already rgistered for the second test  */
  it("3.1 Inserting correct fields should lead to a correct registration process and login page", () => {
    cy.visit(REGISTERPAGE_URL);
    const fn = generateRandomString(15);
    const ln = generateRandomString(15);
    const un = generateRandomString(10);
    const email =
      generateRandomString(10) + "@partest." + generateRandomString(4);
    const pwd = generateRandomString(10);
    registerPage.insertFirstName(fn);
    registerPage.insertLastName(ln);
    registerPage.insertUsername(un);
    registerPage.insertEmail(email);
    registerPage.insertPassword(pwd);
    registerPage.submitForm();
    registerPage.acceptAlertValid();
    cy.url().should("equal", LOGINPAGE_URL);
  });

  it("3.2 Inserting already used credentials should lead to wrong registration (error) and should NOT lead to login page", () => {
    cy.visit(REGISTERPAGE_URL);
    const fn = generateRandomString(15);
    const ln = generateRandomString(15);
    const un = "giack.team5";
    const email = "giack@team.five";
    const pwd = generateRandomString(10);
    registerPage.insertFirstName(fn);
    registerPage.insertLastName(ln);
    registerPage.insertUsername(un);
    registerPage.insertEmail(email);
    registerPage.insertPassword(pwd);
    registerPage.submitForm();
    registerPage.acceptAlertNotValid();
    cy.url().should("equal", REGISTERPAGE_URL);
  });

  it("3.3 clicking on Log in link should lead to login page", () => {
    cy.visit(REGISTERPAGE_URL);
    registerPage.clickLogin();
    cy.url().should('equal', LOGINPAGE_URL);
  })
});
