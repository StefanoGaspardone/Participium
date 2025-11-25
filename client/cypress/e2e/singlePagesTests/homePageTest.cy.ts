import {
  HOMEPAGE_URL,
  LOGINPAGE_URL,
  UPLOADREPORTPAGE_URL,
} from "../../support/utils";
import { homePage } from "../../pageObjects/homePage";
import { loginPage } from "../../pageObjects/loginPage";

const performLoginAsCitizen = () => {
  cy.visit(LOGINPAGE_URL);
  loginPage.insertUsername("giack.team5");
  loginPage.insertPassword("password");
  loginPage.submitForm();
  loginPage.acceptAlertValid();
  cy.wait(1500);
  cy.url().should("equal", HOMEPAGE_URL);
};

describe("1. Test suite for home page :", () => {
  /** NON LOGGED user tests */
  it("1.1 Login button should lead to right login page", () => {
    cy.visit(HOMEPAGE_URL);
    homePage.clickLogin();
    cy.url().should("equal", LOGINPAGE_URL);
  });

  it("1.2 Login link should lead to right login page", () => {
    cy.visit(HOMEPAGE_URL);
    homePage.clickLogin2();
    cy.url().should("equal", LOGINPAGE_URL);
  });

  /** LOGGED user tests */
  it("1.3 As a logged user i should be able to click the map and select a location (identified b latitude and longitude)", () => {
    performLoginAsCitizen();
    cy.wait(3000);
    cy.get('[alt="Marker"]').should('not.exist');
    homePage.clickOnMap();
    cy.get('[alt="Marker"]').should('be.visible');
  });

  it("1.4 As a logged user i should be able to go onto the upload a new report page", () => {
    performLoginAsCitizen();
    homePage.clickNewReport();
    cy.url().should("equal", UPLOADREPORTPAGE_URL);
  });

  it("1.5 As a logged user (citizen) I should be able to open notifications dropdown", () => {
    performLoginAsCitizen();
    homePage.clickNotifications();
  });

});
