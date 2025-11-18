import { ADMINPAGE_URL, HOMEPAGE_URL, LOGINPAGE_URL } from "../../support/utils";
import { loginPage } from "../../pageObjects/loginPage";
import { adminPage } from "../../pageObjects/adminPage";
import { generateRandomString } from "../../pageObjects/utils";

const performLoginAsAdmin = () => {
  cy.visit(LOGINPAGE_URL);
  loginPage.insertUsername("admin");
  loginPage.insertPassword("admin");
  loginPage.submitForm();
  loginPage.acceptAlertValid();
  cy.url().should("equal", ADMINPAGE_URL);  // at each login performed, it is checked whether user is redirected to the admin page
};

describe("5. Test suite for the admin page (used to create new municipality users)", () => {
    it('5.1 Logging in as an admin should redirect me to the admin page', () => {
        performLoginAsAdmin();
    });
    it('5.2 As an admin, trying to visit another page, should redirect me to the admin page again', () => {
        performLoginAsAdmin();
        cy.wait(2000);
        cy.visit(HOMEPAGE_URL); // as a admin i try to go on another page
        cy.wait(2000);
        cy.url().should("equal", ADMINPAGE_URL); // check that i am taken back to admin page
    });
    it('5.3 As an admin I should be able to create a new Municipality User with role *Municipal Administrator* inserting all the right parameters', () => {
        performLoginAsAdmin();
        cy.wait(2000);
        adminPage.insertFirstName(generateRandomString(10));
        adminPage.insertLastName(generateRandomString(10));
        adminPage.insertUsername(generateRandomString(15));
        adminPage.insertEmail(generateRandomString(15) + "@participium.gov");
        adminPage.insertPassword("password");
        adminPage.selectRole(0);
        adminPage.submitReport();
    });
    it('5.4 As an admin I should be able to create a new Municipality User with role *Municipal Public Relations Officer* inserting all the right parameters', () => {
        performLoginAsAdmin();
        cy.wait(2000);
        adminPage.insertFirstName(generateRandomString(10));
        adminPage.insertLastName(generateRandomString(10));
        adminPage.insertUsername(generateRandomString(15));
        adminPage.insertEmail(generateRandomString(15) + "@participium.gov");
        adminPage.insertPassword("password");
        adminPage.selectRole(1);
        adminPage.submitReport();
    });
    it('5.5 As an admin I should be able to create a new Municipality User with role *Technical Office Staff Member* inserting all the right parameters', () => {
        performLoginAsAdmin();
        cy.wait(2000);
        adminPage.insertFirstName(generateRandomString(10));
        adminPage.insertLastName(generateRandomString(10));
        adminPage.insertUsername(generateRandomString(15));
        adminPage.insertEmail(generateRandomString(15) + "@participium.gov");
        adminPage.insertPassword("password");
        adminPage.selectRole(2);
        adminPage.selectOffice(1);
        adminPage.submitReport();
    });
})