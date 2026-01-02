import { LOGINPAGE_URL, PUBRELOFFPAGE_URL } from '../../support/utils';
import { loginPage } from '../../pageObjects/loginPage';
import { proPage } from '../../pageObjects/proPage';

const makeToken = (user: any) => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ user, exp }));
    return `${header}.${payload}.`;
};

const proToken = makeToken({
    id: 42,
    username: 'prouser',
    email: 'pro@example.test',
    firstName: 'Pro',
    lastName: 'User',
    userType: 'PUBLIC_RELATIONS_OFFICER',
    emailNotificationsEnabled: true,
});

const stubLoginPro = () => {
    cy.intercept('POST', '/api/users/login', (req) => {
        req.reply({ statusCode: 200, body: { message: 'Login successful', token: proToken } });
    }).as('loginPRO');
};

const sampleReports = [
    {
        id: 101,
        title: 'Report A',
        createdAt: new Date().toISOString(),
        category: { id: 1, name: 'Road' },
        images: [],
        lat: '45.0',
        long: '7.0',
    },
];

const stubProPageData = () => {
    cy.intercept('GET', '/api/categories', {
        statusCode: 200,
        body: { categories: [ { id: 1, name: 'Road' }, { id: 2, name: 'Lighting' } ] },
    }).as('getCategories');

    cy.intercept('GET', '/api/reports*', (req) => {
        const url = req.url || '';
        if(url.includes('status=PendingApproval')) {
            req.reply({ statusCode: 200, body: { reports: sampleReports } });
        }
    }).as('getReports');
};

const performLoginAsPro = () => {
    stubLoginPro();
    stubProPageData();

    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername('prouser');
    loginPage.insertPassword('password');
    loginPage.submitForm();

    cy.wait('@loginPRO');
    cy.wait(['@getCategories', '@getReports']);
    cy.url().should('equal', PUBRELOFFPAGE_URL);
};

describe('6. Test suite for Public Relations Officer page', () => {
    beforeEach(() => {
        cy.intercept('POST', '/api/users/me', { statusCode: 401, body: { message: 'Unauthorized' } }).as('me');
    });

    it('6.1 Logging in as a Public Relations Officer should lead to Public Relations Officer page', () => {
        performLoginAsPro();
    });

    it('6.2 Clicking on brand/home should keep me on the PRO page', () => {
        performLoginAsPro();
        cy.get('[id="to-homepage"]').click();
        cy.url().should('equal', PUBRELOFFPAGE_URL);
    });

    it('6.3 Accept a pending report removes it from the list', () => {
        performLoginAsPro();

        proPage.reportShouldExist('Report A');

        cy.intercept('PUT', '/api/reports/101/status/public', {
            statusCode: 200,
            body: { report: { ...sampleReports[0], status: 'Assigned' } },
        }).as('assignReport');

        proPage.clickAccept('Report A');
        cy.wait('@assignReport');
        proPage.reportShouldNotExist('Report A');
    });

    it('6.4 Reject a pending report with a reason should remove it from the list', () => {
        performLoginAsPro();

        proPage.reportShouldExist('Report A');

        cy.intercept('PUT', '/api/reports/101/status/public', (req) => {
            expect(req.body).to.have.property('status', 'Rejected');
            expect(req.body).to.have.property('rejectedDescription');
            
            req.reply({ statusCode: 200, body: { report: { ...sampleReports[0], status: 'Rejected' } } });
        }).as('rejectReport');

        proPage.clickReject('Report A');
        cy.get('textarea[placeholder="Enter reason to reject this report"]').type('Not relevant', { force: true });
        cy.contains('button', 'Confirm Reject').click();

        cy.wait('@rejectReport');
        proPage.reportShouldNotExist('Report A');
    });

    it('6.5 Change category for a pending report', () => {
        performLoginAsPro();

        proPage.reportShouldExist('Report A');

        cy.intercept('PUT', '/api/reports/101/category', (req) => {
            expect(req.body).to.have.property('categoryId', 2);
            
            req.reply({ statusCode: 200, body: { report: { ...sampleReports[0], category: { id: 2, name: 'Lighting' } } } });
        }).as('changeCategory');

        cy.get('[id="select-category-101"]').click({ force: true });
        cy.contains('.rs__option', 'Lighting', { timeout: 5000 }).click({ force: true });

        cy.wait('@changeCategory');
    });
});