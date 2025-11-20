import {
  UPLOADREPORTPAGE_URL,
  HOMEPAGE_URL,
  LOGINPAGE_URL,
} from "../../support/utils";
import { reportPage } from "../../pageObjects/reportPage";
import { loginPage } from "../../pageObjects/loginPage";
import { homePage } from "../../pageObjects/homePage";
import { generateRandomString } from "../../pageObjects/utils";

const performLoginAsCitizen = () => {
  cy.visit(LOGINPAGE_URL);
  loginPage.insertUsername("giack.team5");
  loginPage.insertPassword("password");
  loginPage.submitForm();
  loginPage.acceptAlertValid();
  cy.url().should("equal", HOMEPAGE_URL);
};

describe("4. Test suite for report page :", () => {
  it("4.1 As a logged user (citizen) i should be able to insert datas and upload a new report", () => {
    performLoginAsCitizen();
    cy.wait(2000);
    const t = generateRandomString(10);
    const d = generateRandomString(20);
    homePage.clickNewReport();
    cy.url().should('equal', UPLOADREPORTPAGE_URL);
    reportPage.clickOnMap();
    reportPage.insertTitle(t);
    reportPage.insertDescription(d);
    reportPage.selectCategory(3);
    reportPage.insertImages(1);
    reportPage.submitForm();
    reportPage.acceptAlertValid(); // the "test" is contained here (checking the dialogue window)
  });
  it('4.2 As a logged user (citizen) i shouldn\'t be able to upload a new report if one or more fields are not inserted ', () => {
      performLoginAsCitizen();
    cy.wait(2000);
    const t = generateRandomString(10);
    const d = generateRandomString(20);
    homePage.clickNewReport();
    cy.url().should('equal', UPLOADREPORTPAGE_URL);
    reportPage.clickOnMap();
    reportPage.insertTitle(t);
    reportPage.insertDescription(d);
    reportPage.selectCategory(3);
    // we do NOT insert images
    reportPage.submitFormNotVisible(); //we check that the upload button should NOT be clickable (it should be disabled)
  });
});
