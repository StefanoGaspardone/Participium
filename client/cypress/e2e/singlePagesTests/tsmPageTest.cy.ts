import { homePage } from "../../pageObjects/homePage";
import { loginPage } from "../../pageObjects/loginPage";
import { proPage } from "../../pageObjects/proPage";
import { reportPage } from "../../pageObjects/reportPage";
import { tsmPage } from "../../pageObjects/tsmPage";
import { generateRandomString, TIME_AFTER_UPLOAD } from "../../pageObjects/utils";
import {
  HOMEPAGE_URL,
  LOGINPAGE_URL,
  PUBRELOFFPAGE_URL,
  TSMPAGE_URL,
} from "../../support/utils";
import { TIME_REPORT_LOAD } from "../../pageObjects/utils";


const performLogout = () => {
    cy.get('[id="profile-picture"]').click({force: true});
    cy.get('[id="logout-button"]').focus().click({force: true});
    cy.visit(HOMEPAGE_URL);
    cy.url().should('equal', HOMEPAGE_URL);
}

const performLoginAsPro = () => {
    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername('pro');
    loginPage.insertPassword('password');
    loginPage.submitForm();
    loginPage.acceptAlertValid();
    cy.wait(2000);
    cy.url().should('equal', PUBRELOFFPAGE_URL);
}

const performLoginAsCitizen = () => {
  cy.visit(LOGINPAGE_URL);
  loginPage.insertUsername("giack.team5");
  loginPage.insertPassword("password");
  loginPage.submitForm();
  loginPage.acceptAlertValid();
  cy.wait(1500);
  cy.url().should("equal", HOMEPAGE_URL);
};

const createNewRandomReport = (title: string, description: string) => {
    performLoginAsCitizen();
    homePage.clickNewReport();
    cy.wait(TIME_REPORT_LOAD);
    reportPage.clickRandomOnMap();
    reportPage.insertTitle(title);
    reportPage.insertDescription(description);
    reportPage.selectCategory(1);
    reportPage.insertImages(1);
    reportPage.submitForm();
}

const performLoginAsTsm = () => {
  cy.visit(LOGINPAGE_URL);
  loginPage.insertUsername("tsm2");
  loginPage.insertPassword("password");
  loginPage.submitForm();
  loginPage.acceptAlertValid();
  cy.wait(2000);
  cy.url().should("equal", TSMPAGE_URL);
};

const acceptReport = (title: string) => {
  performLoginAsPro();
  cy.url().should("equal", PUBRELOFFPAGE_URL);
  proPage.reportShouldExist(title);
  proPage.expandReport(title);
  proPage.clickAccept(title);
  proPage.reportShouldNotExist(title);
};

describe("7. Test suite for Technical Staff Member", () => {
  it.skip("7.1 The creation and acceptance of a new report should be displayed in tsm page of the right office", () => {
    const randomTitle = generateRandomString(10);
    const randomDescription = generateRandomString(20);
    createNewRandomReport(randomTitle, randomDescription);
    cy.wait(TIME_AFTER_UPLOAD);
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
  it("7.2 After a new report is created and accepted, the button 'start progress' exists, and after being clicked the status is 'InProgress'", () => {
    const randomTitle = generateRandomString(10);
    const randomDescription = generateRandomString(20);
    createNewRandomReport(randomTitle, randomDescription);
    cy.wait(TIME_AFTER_UPLOAD);
    performLogout();
    cy.wait(1500);
    acceptReport(randomTitle);
    cy.wait(1500);
    performLogout();
    cy.wait(1500);
    performLoginAsTsm();
    cy.url().should("equal", TSMPAGE_URL);
    tsmPage.getAssignedReports().should("contain", randomTitle);
    tsmPage.expandReport(randomTitle);
    tsmPage.isCurrentStatus('Assigned', randomTitle);
    tsmPage.startProgress(randomTitle);
    tsmPage.isCurrentStatus('InProgress', randomTitle);
  });
  it("7.3 After a new report is created and accepted, the button 'start progress' exists, and after being clicked the status is 'InProgress' and then, after clicking 'Mark as resolved' the status is 'Resolved' ", () => {
    const randomTitle = generateRandomString(10);
    const randomDescription = generateRandomString(20);
    createNewRandomReport(randomTitle, randomDescription);
    cy.wait(TIME_AFTER_UPLOAD);
    performLogout();
    cy.wait(1500);
    acceptReport(randomTitle);
    cy.wait(1500);
    performLogout();
    cy.wait(1500);
    performLoginAsTsm();
    cy.url().should("equal", TSMPAGE_URL);
    tsmPage.getAssignedReports().should("contain", randomTitle);
    tsmPage.expandReport(randomTitle);
    tsmPage.isCurrentStatus('Assigned', randomTitle);
    tsmPage.startProgress(randomTitle);
    tsmPage.isCurrentStatus('InProgress', randomTitle);
    tsmPage.markAsResolved(randomTitle);
    tsmPage.isCurrentStatus('Resolved', randomTitle);
  });
  it("7.4 After a new report is created and accepted, the button 'start progress' exists, and after being clicked the status is 'InProgress' and then, after clicking 'Suspend' the status is 'suspended' ", () => {
    const randomTitle = generateRandomString(10);
    const randomDescription = generateRandomString(20);
    createNewRandomReport(randomTitle, randomDescription);
    cy.wait(TIME_AFTER_UPLOAD);
    performLogout();
    cy.wait(1500);
    acceptReport(randomTitle);
    cy.wait(1500);
    performLogout();
    cy.wait(1500);
    performLoginAsTsm();
    cy.url().should("equal", TSMPAGE_URL);
    tsmPage.getAssignedReports().should("contain", randomTitle);
    tsmPage.expandReport(randomTitle);
    tsmPage.isCurrentStatus('Assigned', randomTitle);
    tsmPage.startProgress(randomTitle);
    tsmPage.isCurrentStatus('InProgress', randomTitle);
    tsmPage.suspend(randomTitle);
    tsmPage.isCurrentStatus('Suspended', randomTitle);
  });
  it("7.5 After a new report is created and accepted, the button 'start progress' exists, and after being clicked the status is 'InProgress' and then, after clicking 'Suspend' the status is 'suspended' ", () => {
    const randomTitle = generateRandomString(10);
    const randomDescription = generateRandomString(20);
    createNewRandomReport(randomTitle, randomDescription);
    cy.wait(TIME_AFTER_UPLOAD);
    performLogout();
    cy.wait(1500);
    acceptReport(randomTitle);
    cy.wait(1500);
    performLogout();
    cy.wait(1500);
    performLoginAsTsm();
    cy.url().should("equal", TSMPAGE_URL);
    tsmPage.getAssignedReports().should("contain", randomTitle);
    tsmPage.expandReport(randomTitle);
    tsmPage.isCurrentStatus('Assigned', randomTitle);
    tsmPage.startProgress(randomTitle);
    tsmPage.isCurrentStatus('InProgress', randomTitle);
    tsmPage.suspend(randomTitle);
    tsmPage.isCurrentStatus('Suspended', randomTitle);
    tsmPage.resumeProgress(randomTitle);
    tsmPage.isCurrentStatus('InProgress', randomTitle);
  });
});
