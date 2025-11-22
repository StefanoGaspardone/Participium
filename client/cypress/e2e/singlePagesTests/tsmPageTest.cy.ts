import { loginPage } from "../../pageObjects/loginPage";
import { proPage } from "../../pageObjects/proPage";
import { tsmPage } from "../../pageObjects/tsmPage";
import { generateRandomString } from "../../pageObjects/utils";
import {
  LOGINPAGE_URL,
  PUBRELOFFPAGE_URL,
  TSMPAGE_URL,
} from "../../support/utils";
import {
  createNewRandomReport,
  performLoginAsPro,
  performLogout,
} from "./proPageTest.cy";

export const;

export const performLoginAsTsm = () => {
  cy.visit(LOGINPAGE_URL);
  loginPage.insertUsername("tsm2");
  loginPage.insertPassword("password");
  loginPage.submitForm();
  loginPage.acceptAlertValid();
  cy.wait(2000);
  cy.url().should("equal", TSMPAGE_URL);
};

export const acceptReport = (title: string) => {
  performLoginAsPro();
  cy.url().should("equal", PUBRELOFFPAGE_URL);
  proPage.reportShouldExist(title);
  proPage.expandReport(title);
  proPage.clickAccept(title);
  proPage.reportShouldNotExist(title);
};

describe("7. Test suite for Technical Staff Member", () => {
  it("7.1 The creation and acceptance of a new report should be displayed in tsm page of the right office", () => {
    const randomTitle = generateRandomString(10);
    const randomDescription = generateRandomString(20);
    createNewRandomReport(randomTitle, randomDescription);
    cy.wait(1500);
    performLogout();
    cy.wait(1500);
    acceptReport(randomTitle);
    cy.wait(1500);
    performLogout();
    cy.wait(1500);
    performLoginAsTsm();
    cy.url().should("equal", TSMPAGE_URL);
    tsmPage.getAssignedReports().should("contain", randomTitle);
  });
});
