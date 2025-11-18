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
    cy.get('[id="selected-location"]').should(
      "contain.text",
      "Click on the map to pick a location"
    );
    cy.get('[id="map-container"]').click();
    cy.get('[id="selected-location"]').should(
      "contain.text",
      "Selected location"
    );
    // the location is the "default" based on how the click action is performed by cypress on the Map Component
  });

  it("1.4 As a logged user i should be able to go onto the upload a new report page", () => {
    performLoginAsCitizen();
    cy.get('[id="upload-new-report-button"]').click();
    cy.url().should("equal", UPLOADREPORTPAGE_URL);
  });
});
