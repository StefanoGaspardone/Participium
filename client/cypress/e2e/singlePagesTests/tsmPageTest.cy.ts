import { loginPage } from "../../pageObjects/loginPage";
import { LOGINPAGE_URL, TSMPAGE_URL } from "../../support/utils";

const makeToken = (user: any) => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ user, exp }));
    return `${header}.${payload}.`;
};

const tsmToken = makeToken({
    id: 42,
    username: 'tsmuser',
    email: 'tsm@example.test',
    firstName: 'Tsm',
    lastName: 'User',
    userType: 'TECHNICAL_STAFF_MEMBER',
    emailNotificationsEnabled: true,
});

const stubLoginTsm = () => {
    cy.intercept('POST', '/api/users/login', (req) => {
        req.reply({ statusCode: 200, body: { message: 'Login successful', token: tsmToken } });
    }).as('loginTSM');
};

const performLoginAsTsm = () => {
    stubLoginTsm();

    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername('prouser');
    loginPage.insertPassword('password');
    loginPage.submitForm();

    cy.wait('@loginTSM');
    cy.url().should('equal', TSMPAGE_URL);
};

describe("9. Test suite for Technical Staff Member", () => {
    beforeEach(() => {
        cy.intercept('POST', '/api/users/me', { statusCode: 401, body: { message: 'Unauthorized' } }).as('me');
    });

    it('9.1 Logging in as a Technical Staff Member should lead to Technical Staff Member page', () => {
        performLoginAsTsm();
    });

    it('9.2 Clicking on brand/home should keep me on the TSM page', () => {
        performLoginAsTsm();
        cy.get('[id="to-homepage"]').click();
        cy.url().should('equal', TSMPAGE_URL);
    });
  
  // it.skip("7.1 The creation and acceptance of a new report should be displayed in tsm page of the right office", () => {
  //   const randomTitle = generateRandomString(10);
  //   const randomDescription = generateRandomString(20);
  //   createNewRandomReport(randomTitle, randomDescription);
  //   cy.wait(TIME_AFTER_UPLOAD);
  //   performLogout();
  //   cy.wait(1500);
  //   acceptReport(randomTitle);
  //   cy.wait(1500);
  //   performLogout();
  //   cy.wait(1500);
  //   performLoginAsTsm();
  //   cy.url().should("equal", TSMPAGE_URL);
  //   tsmPage.getAssignedReports().should("contain", randomTitle);
  // });
  // it("7.2 After a new report is created and accepted, the button 'start progress' exists, and after being clicked the status is 'InProgress'", () => {
  //   const randomTitle = generateRandomString(10);
  //   const randomDescription = generateRandomString(20);
  //   createNewRandomReport(randomTitle, randomDescription);
  //   cy.wait(TIME_AFTER_UPLOAD);
  //   performLogout();
  //   cy.wait(1500);
  //   acceptReport(randomTitle);
  //   cy.wait(1500);
  //   performLogout();
  //   cy.wait(1500);
  //   performLoginAsTsm();
  //   cy.url().should("equal", TSMPAGE_URL);
  //   tsmPage.getAssignedReports().should("contain", randomTitle);
  //   tsmPage.expandReport(randomTitle);
  //   tsmPage.isCurrentStatus('Assigned', randomTitle);
  //   tsmPage.startProgress(randomTitle);
  //   tsmPage.isCurrentStatus('InProgress', randomTitle);
  // });
  // it("7.3 After a new report is created and accepted, the button 'start progress' exists, and after being clicked the status is 'InProgress' and then, after clicking 'Mark as resolved' the status is 'Resolved' ", () => {
  //   const randomTitle = generateRandomString(10);
  //   const randomDescription = generateRandomString(20);
  //   createNewRandomReport(randomTitle, randomDescription);
  //   cy.wait(TIME_AFTER_UPLOAD);
  //   performLogout();
  //   cy.wait(1500);
  //   acceptReport(randomTitle);
  //   cy.wait(1500);
  //   performLogout();
  //   cy.wait(1500);
  //   performLoginAsTsm();
  //   cy.url().should("equal", TSMPAGE_URL);
  //   tsmPage.getAssignedReports().should("contain", randomTitle);
  //   tsmPage.expandReport(randomTitle);
  //   tsmPage.isCurrentStatus('Assigned', randomTitle);
  //   tsmPage.startProgress(randomTitle);
  //   tsmPage.isCurrentStatus('InProgress', randomTitle);
  //   tsmPage.markAsResolved(randomTitle);
  //   tsmPage.isCurrentStatus('Resolved', randomTitle);
  // });
  // it("7.4 After a new report is created and accepted, the button 'start progress' exists, and after being clicked the status is 'InProgress' and then, after clicking 'Suspend' the status is 'suspended' ", () => {
  //   const randomTitle = generateRandomString(10);
  //   const randomDescription = generateRandomString(20);
  //   createNewRandomReport(randomTitle, randomDescription);
  //   cy.wait(TIME_AFTER_UPLOAD);
  //   performLogout();
  //   cy.wait(1500);
  //   acceptReport(randomTitle);
  //   cy.wait(1500);
  //   performLogout();
  //   cy.wait(1500);
  //   performLoginAsTsm();
  //   cy.url().should("equal", TSMPAGE_URL);
  //   tsmPage.getAssignedReports().should("contain", randomTitle);
  //   tsmPage.expandReport(randomTitle);
  //   tsmPage.isCurrentStatus('Assigned', randomTitle);
  //   tsmPage.startProgress(randomTitle);
  //   tsmPage.isCurrentStatus('InProgress', randomTitle);
  //   tsmPage.suspend(randomTitle);
  //   tsmPage.isCurrentStatus('Suspended', randomTitle);
  // });
  // it("7.5 After a new report is created and accepted, the button 'start progress' exists, and after being clicked the status is 'InProgress' and then, after clicking 'Suspend' the status is 'suspended' ", () => {
  //   const randomTitle = generateRandomString(10);
  //   const randomDescription = generateRandomString(20);
  //   createNewRandomReport(randomTitle, randomDescription);
  //   cy.wait(TIME_AFTER_UPLOAD);
  //   performLogout();
  //   cy.wait(1500);
  //   acceptReport(randomTitle);
  //   cy.wait(1500);
  //   performLogout();
  //   cy.wait(1500);
  //   performLoginAsTsm();
  //   cy.url().should("equal", TSMPAGE_URL);
  //   tsmPage.getAssignedReports().should("contain", randomTitle);
  //   tsmPage.expandReport(randomTitle);
  //   tsmPage.isCurrentStatus('Assigned', randomTitle);
  //   tsmPage.startProgress(randomTitle);
  //   tsmPage.isCurrentStatus('InProgress', randomTitle);
  //   tsmPage.suspend(randomTitle);
  //   tsmPage.isCurrentStatus('Suspended', randomTitle);
  //   tsmPage.resumeProgress(randomTitle);
  //   tsmPage.isCurrentStatus('InProgress', randomTitle);
  // });
});
