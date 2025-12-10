import { loginPage } from "../../pageObjects/loginPage";
import { LOGINPAGE_URL, MAINTAINERPAGE_URL } from "../../support/utils";

const makeToken = (user: any) => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ user, exp }));
    return `${header}.${payload}.`;
};

const mntToken = makeToken({
    id: 42,
    username: 'mntuser',
    email: 'mnt@example.test',
    firstName: 'Mnt',
    lastName: 'User',
    userType: 'EXTERNAL_MAINTAINER',
    emailNotificationsEnabled: true,
});

const stubLoginMnt = () => {
    cy.intercept('POST', '/api/users/login', (req) => {
        req.reply({ statusCode: 200, body: { message: 'Login successful', token: mntToken } });
    }).as('loginMNT');
};

const performLoginAsMnt = () => {
    stubLoginMnt();

    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername('mntuser');
    loginPage.insertPassword('password');
    loginPage.submitForm();

    cy.wait('@loginMNT');
    cy.url().should('equal', MAINTAINERPAGE_URL);
};

describe("5. Test suite for External Maintainer", () => {
    beforeEach(() => {
        cy.intercept('POST', '/api/users/me', { statusCode: 401, body: { message: 'Unauthorized' } }).as('me');
    });

    it('5.1 Logging in as an External Maintainer should lead to External Maintainer page', () => {
        performLoginAsMnt();
    });

    it('5.2 Clicking on brand/home should keep me on the MNT page', () => {
        performLoginAsMnt();
        cy.get('[id="to-homepage"]').click();
        cy.url().should('equal', MAINTAINERPAGE_URL);
    });
});
