import { HOMEPAGE_URL, LOGINPAGE_URL, PROFILEPAGE_URL } from "../../support/utils";
import { homePage } from "../../pageObjects/homePage";
import { loginPage } from "../../pageObjects/loginPage";
import { profilePage } from "../../pageObjects/profilePage";
import { stubUploadSigningAndCloudinary } from "./reportPageTest.cy";
import { generateRandomString } from "../../pageObjects/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeToken = (user: any) => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ user, exp }));
    return `${header}.${payload}.`;
};

const stubReportsEndpoints = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emptyList: any[] = [];

    cy.intercept('GET', /\/api\/reports\?status=Assigned.*/, { statusCode: 200, body: { reports: emptyList } }).as('reportsAssigned');
    cy.intercept('GET', /\/api\/reports\?status=InProgress.*/, { statusCode: 200, body: { reports: emptyList } }).as('reportsInProgress');
    cy.intercept('GET', /\/api\/reports\?status=Suspended.*/, { statusCode: 200, body: { reports: emptyList } }).as('reportsSuspended');
    cy.intercept('GET', /\/api\/reports\?status=Resolved.*/, { statusCode: 200, body: { reports: emptyList } }).as('reportsResolved');
};

export const performLoginAsCitizen = () => {
    cy.intercept('POST', '/api/users/login', (req) => {
        const token = makeToken({
            id: 1,
            username: 'user',
            email: 'user@example.test',
            firstName: 'User',
            lastName: 'Test',
            userType: 'CITIZEN',
            emailNotificationsEnabled: false
        });
        req.reply({ statusCode: 200, body: { message: 'Login successful', token } });
    }).as('loginCitizen');

    stubReportsEndpoints();

    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername('user');
    loginPage.insertPassword('user');
    loginPage.submitForm();
    cy.wait('@loginCitizen');
    cy.url().should('equal', HOMEPAGE_URL);
};

const goToProfileAsCitizen = () => {
    performLoginAsCitizen();
    homePage.clickProfileDropdown();
    homePage.clickProfile();
    cy.url().should("equal", PROFILEPAGE_URL);
};

describe("9. Test suite for profile page :", () => {

    beforeEach(() => {
        cy.intercept('GET', '/api/users/me', { statusCode: 401, body: { message: 'Unauthorized' } }).as('meUnauthorized');
    });
    it('9.1 As a logged user i should be able to edit my first name', () => {
        goToProfileAsCitizen();
        profilePage.clickEditProfile();
        const newFirstName = generateRandomString(10);
        cy.intercept('PATCH', '/api/users/me', (req) => {
            const user = {
                id: 1,
                firstName: newFirstName,
                lastName: 'Pirlo',
                email: 'user@example.test',
                username: 'user',
                image: null,
                telegramUsername: null,
                userType: 'CITIZEN',
                emailNotificationsEnabled: true,
                offices: [],
                company: null,
                createdAt: '2025-12-27T09:58:50.899Z',
                isActive: true,
            };
            req.reply({ statusCode: 200, body: { message: 'Profile updated successfully!', user } });
        }).as('updateProfile');
        profilePage.insertFirstName(newFirstName);
        profilePage.submitProfileChanges();
        cy.wait(1000);
        profilePage.checkFirstName(newFirstName);
    });

    it('9.2 As a logged user i should be able to edit my last name', () => {
        goToProfileAsCitizen();
        profilePage.clickEditProfile();
        const newLastName = generateRandomString(10);
        cy.intercept('PATCH', '/api/users/me', (req) => {
            const user = {
                id: 1,
                firstName: 'Giacomo',
                lastName: newLastName,
                email: 'user@example.test',
                username: 'user',
                image: null,
                telegramUsername: null,
                userType: 'CITIZEN',
                emailNotificationsEnabled: true,
                offices: [],
                company: null,
                createdAt: '2025-12-27T09:58:50.899Z',
                isActive: true,
            };
            req.reply({ statusCode: 200, body: { message: 'Profile updated successfully!', user } });
        }).as('updateProfile');
        profilePage.insertLastName(newLastName);
        profilePage.submitProfileChanges();
        cy.wait(1000);
        profilePage.checkLastName(newLastName);
    });

    it('9.3 As a logged user i should be able to edit my username', () => {
        goToProfileAsCitizen();
        profilePage.clickEditProfile();
        const newUsername = generateRandomString(10);
        cy.intercept('PATCH', '/api/users/me', (req) => {
            const user = {
                id: 1,
                firstName: 'Giacomo',
                lastName: 'Pirlo',
                email: 'user@example.test',
                username: newUsername,
                image: null,
                telegramUsername: null,
                userType: 'CITIZEN',
                emailNotificationsEnabled: true,
                offices: [],
                company: null,
                createdAt: '2025-12-27T09:58:50.899Z',
                isActive: true,
            };
            req.reply({ statusCode: 200, body: { message: 'Profile updated successfully!', user } });
        }).as('updateProfile');
        profilePage.insertLastName(newUsername);
        profilePage.submitProfileChanges();
        cy.wait(1000);
        profilePage.checkUsername(newUsername);
    });

    it('9.4 As a logged user i should be able to edit my email', () => {
        goToProfileAsCitizen();
        profilePage.clickEditProfile();
        const newEmail = generateRandomString(10) + "@example.se";
        cy.intercept('PATCH', '/api/users/me', (req) => {
            const user = {
                id: 1,
                firstName: 'Giacomo',
                lastName: 'Pirlo',
                email: newEmail,
                username: 'user',
                image: null,
                telegramUsername: null,
                userType: 'CITIZEN',
                emailNotificationsEnabled: true,
                offices: [],
                company: null,
                createdAt: '2025-12-27T09:58:50.899Z',
                isActive: true,
            };
            req.reply({ statusCode: 200, body: { message: 'Profile updated successfully!', user } });
        }).as('updateProfile');
        profilePage.insertLastName(newEmail);
        profilePage.submitProfileChanges();
        cy.wait(1000);
        profilePage.checkEmail(newEmail);
    });

    it('9.5 As a logged user i should be able to edit my telegram username', () => {
        goToProfileAsCitizen();
        profilePage.clickEditProfile();
        const newTelegramUsername = generateRandomString(10);
        cy.intercept('PATCH', '/api/users/me', (req) => {
            const user = {
                id: 1,
                firstName: 'Giacomo',
                lastName: 'Pirlo',
                email: 'user@example.test',
                username: 'user',
                image: null,
                telegramUsername: newTelegramUsername,
                userType: 'CITIZEN',
                emailNotificationsEnabled: true,
                offices: [],
                company: null,
                createdAt: '2025-12-27T09:58:50.899Z',
                isActive: true,
            };
            req.reply({ statusCode: 200, body: { message: 'Profile updated successfully!', user } });
        }).as('updateProfile');
        profilePage.insertTelegramUsername(newTelegramUsername);
        profilePage.submitProfileChanges();
        cy.wait(1000);
        profilePage.checkTelegramUsername(newTelegramUsername);
    });

    it('9.6 As a logged user i should be able to enable email notifications', () => {
        goToProfileAsCitizen();
        cy.intercept('PATCH', '/api/users/me', (req) => {
            const user = {
                id: 1,
                firstName: 'Giacomo',
                lastName: 'Pirlo',
                email: 'user@example.test',
                username: 'user',
                image: null,
                telegramUsername: null,
                userType: 'CITIZEN',
                emailNotificationsEnabled: true,
                offices: [],
                company: null,
                createdAt: '2025-12-27T09:58:50.899Z',
                isActive: true,
            };
            req.reply({ statusCode: 200, body: { message: 'Profile updated successfully!', user } });
        }).as('updateProfile');
        profilePage.checkEmailNotificationsNotChecked();
        profilePage.clickEditProfile();
        profilePage.toggleEmailNotifications();
        profilePage.submitProfileChanges();
        cy.wait(1000);
        profilePage.checkEmailNotificationsChecked();
    });
});