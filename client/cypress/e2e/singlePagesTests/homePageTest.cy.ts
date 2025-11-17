import { HOMEPAGE_URL, LOGINPAGE_URL, UPLOADREPORTPAGE_URL } from "../../support/utils";
import { homePage } from "../../pageObjects/homePage";
import { loginPage } from "../../pageObjects/loginPage";
describe("1. Test suite for homepage tests :", () => {
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

  const performLogin = () => {
    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername("giack.team5");
    loginPage.insertPassword("password");
    loginPage.submitForm();
    loginPage.acceptAlertValid();
    cy.url().should("equal", HOMEPAGE_URL);
  };

  /** LOGGED user tests */
  it("1.3 As a logged user i should be able to click the map and select a location (identified b latitude and longitude)", () => {
    performLogin();
    cy.get('[id="selected-location"]').should(
      "contain.text",
      "Click on the map to pick a location"
    );
    cy.get('[id="map-container"]').click();
    cy.get('[id="selected-location"]').should(
      "contain.text",
      "Selected location: (45.07035759666708, 7.682790756225587)"
    );
    // the location is the "default" based on how the click action is performed by cypress on the Map Component
  });

  it("1.4 As a logged user i should be able to go onto the upload a new report page", () => {
    performLogin();
    cy.get('[id="upload-new-report-button"]').click();
    cy.url().should('equal', UPLOADREPORTPAGE_URL);
  })
});
