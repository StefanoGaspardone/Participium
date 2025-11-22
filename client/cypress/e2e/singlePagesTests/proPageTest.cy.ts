import { PUBRELOFFPAGE_URL, HOMEPAGE_URL, LOGINPAGE_URL } from "../../support/utils";
import { loginPage } from "../../pageObjects/loginPage";
import { homePage } from "../../pageObjects/homePage";
import { reportPage } from "../../pageObjects/reportPage";
import { generateRandomString, TIME_AFTER_UPLOAD } from "../../pageObjects/utils";
import { proPage } from "../../pageObjects/proPage";
import { TIME_REPORT_LOAD } from "../../pageObjects/utils";

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

describe("6. Test suite for Public Relations Officer page", () => {
    it('6.1 The creation of a report by a citizen should lead to a element in the public relations officer page', () => {
        const randomTitle = generateRandomString(10);
        const randomDescription = generateRandomString(20);
        createNewRandomReport(randomTitle, randomDescription);
        cy.wait(TIME_AFTER_UPLOAD);
        performLogout();
        cy.visit(HOMEPAGE_URL);
        performLoginAsPro();
        cy.wait(2000);
        proPage.reportShouldExist(randomTitle);
    });
    it('6.2 The acceptance of a pending report should lead to it not being on the report list anymore', () => {
        const randomTitle = generateRandomString(10);
        const randomDescription = generateRandomString(20);
        createNewRandomReport(randomTitle, randomDescription);
        cy.wait(TIME_AFTER_UPLOAD);
        performLogout();
        cy.visit(HOMEPAGE_URL);
        performLoginAsPro();
        cy.wait(2000);
        proPage.reportShouldExist(randomTitle);
        proPage.expandReport(randomTitle);
        proPage.clickAccept(randomTitle);
        proPage.reportShouldNotExist(randomTitle);
    });
    it('6.3 The reject of a pending report should lead to it not being on the report list anymore', () => {
        const randomTitle = generateRandomString(10);
        const randomDescription = generateRandomString(20);
        createNewRandomReport(randomTitle, randomDescription);
        cy.wait(TIME_AFTER_UPLOAD);
        performLogout();
        cy.visit(HOMEPAGE_URL);
        performLoginAsPro();
        cy.wait(2000);
        proPage.reportShouldExist(randomTitle);
        proPage.expandReport(randomTitle);
        proPage.insertRejectReason(randomTitle);
        proPage.clickReject(randomTitle);
        proPage.reportShouldNotExist(randomTitle);
    });
    it.only('6.4')
})