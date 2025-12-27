import { ADMINPAGE_URL, LOGINPAGE_URL } from "../../support/utils";
import { loginPage } from "../../pageObjects/loginPage";
import { adminPage } from "../../pageObjects/adminPage";
import { generateRandomString } from "../../pageObjects/utils";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeToken = (user: any) => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ user, exp }));
    return `${header}.${payload}.`;
};

const adminToken = makeToken({
    id: 999,
    username: 'admin',
    email: 'admin@example.test',
    firstName: 'Admin',
    lastName: 'User',
    userType: 'ADMINISTRATOR',
    emailNotificationsEnabled: true,
});

const stubLoginAdmin = () => {
    cy.intercept('POST', '/api/users/login', (req) => {
        req.reply({ statusCode: 200, body: { message: 'Login successful', token: adminToken } });
    }).as('loginAdmin');
};

const stubAdminPageData = () => {
    cy.intercept('GET', '/api/offices', {
        statusCode: 200,
        body: [
            { id: 1, name: 'Roads' },
            { id: 2, name: 'Lighting' },
            { id: 3, name: 'Waste' },
        ],
    }).as('getOffices');

    cy.intercept('GET', '/api/companies', {
        statusCode: 200,
        body: [
            { id: 1, name: 'Alpha Maintainers', categories: [{ id: 1, name: 'Road' }] },
            { id: 2, name: 'Beta Services', categories: [{ id: 2, name: 'Lighting' }] },
        ],
    }).as('getCompanies');

    cy.intercept('GET', '/api/categories', {
        statusCode: 200,
        body: {
            categories: [
                { id: 1, name: 'Road' },
                { id: 2, name: 'Lighting' },
                { id: 3, name: 'Trash' },
            ]
        },
    }).as('getCategories');

    cy.intercept('GET', '/api/users/tsm', {
        statusCode: 200,
        body: [
            {
                id: 1, firstName: 'Carmine', lastName: 'Conte', email: 'tsm1@part.se', username: 'tsm1', userType: 'TECHNICAL_STAFF_MEMBER', offices: ["Organization", "Public Services Division"]
            },
        ]
    }).as('getTsm');

    cy.intercept('GET', '/api/offices', {
        statusCode: 200,
        body: [
            { id: 1, name: 'Organization' },
            { id: 2, name: 'Public Services Division' },
            { id: 3, name: 'Environmental Quality Division' },
            { id: 4, name: "Green Areas, Parks and Animal Welfare Division" },
            { id: 5, name: "Infrastructure Division" },
            { id: 6, name: "General Services Division" }
        ]
    }).as('getOffices');
};

const stubCreateEmployee = () => {
    cy.intercept('POST', '/api/users/employees', {
        statusCode: 200,
        body: { message: 'Employee account created successfully!' },
    }).as('createEmployee');
};

const stubCreateCompany = () => {
    cy.intercept('POST', '/api/companies', {
        statusCode: 200,
        body: { message: 'Company created successfully!' },
    }).as('createCompany');
};

const stubUpdateTsmOffices = () => {
    cy.intercept('PATCH', '/api/users/tsm/*', {
        statusCode: 201,
        body: { message: 'Technical Staff Member offices updated successfully!' },
    }).as('updateTsmOffices');
}

const performLoginAsAdmin = () => {
    stubLoginAdmin();
    stubAdminPageData();

    cy.visit(LOGINPAGE_URL);

    loginPage.insertUsername('admin');
    loginPage.insertPassword('admin');
    loginPage.submitForm();

    cy.wait('@loginAdmin');
    cy.wait(['@getOffices', '@getCompanies', '@getCategories']);
    cy.url().should('equal', ADMINPAGE_URL);
};

describe("1. Test suite for the admin page (used to create new municipality users)", () => {
    beforeEach(() => {
        cy.intercept('POST', '/api/users/me', { statusCode: 401, body: { message: 'Unauthorized' } }).as('me');
    });

    it('1.1 Logging in as an admin should redirect me to the admin page', () => {
        performLoginAsAdmin();
    });

    it('1.2 Create Municipal Administrator', () => {
        performLoginAsAdmin();
        stubCreateEmployee();

        const fn = generateRandomString(10);
        const ln = generateRandomString(10);
        const un = generateRandomString(15);
        const em = `${generateRandomString(12)}@participium.gov`;

        adminPage.insertFirstName(fn);
        adminPage.insertLastName(ln);
        adminPage.insertUsername(un);
        adminPage.insertEmail(em);
        adminPage.insertPassword("password");
        adminPage.selectRole(0);
        adminPage.submitAccount();

        cy.wait('@createEmployee');
    });

    it('1.3 Create Municipal Public Relations Officer', () => {
        performLoginAsAdmin();
        stubCreateEmployee();

        adminPage.insertFirstName(generateRandomString(10));
        adminPage.insertLastName(generateRandomString(10));
        adminPage.insertUsername(generateRandomString(15));
        adminPage.insertEmail(`${generateRandomString(12)}@participium.gov`);
        adminPage.insertPassword("password");
        adminPage.selectRole(1);
        adminPage.submitAccount();

        cy.wait('@createEmployee');
    });

    it('1.4 Create Technical Office Staff Member', () => {
        performLoginAsAdmin();
        stubCreateEmployee();

        adminPage.insertFirstName(generateRandomString(10));
        adminPage.insertLastName(generateRandomString(10));
        adminPage.insertUsername(generateRandomString(15));
        adminPage.insertEmail(`${generateRandomString(12)}@participium.gov`);
        adminPage.insertPassword("password");
        adminPage.selectRole(2);
        adminPage.selectOffice(1);
        adminPage.submitAccount();

        cy.wait('@createEmployee');
    });

    it('1.5 Create new Company and then External Maintainer', () => {
        performLoginAsAdmin();
        stubCreateCompany();
        stubCreateEmployee();

        adminPage.insertFirstName(generateRandomString(10));
        adminPage.insertLastName(generateRandomString(10));
        adminPage.insertUsername(generateRandomString(15));
        adminPage.insertEmail(`${generateRandomString(12)}@participium.gov`);
        adminPage.insertPassword("password");
        adminPage.selectRole(3);
        adminPage.selectCompany(2);
        adminPage.submitAccount();

        cy.wait('@createEmployee');
    });

    it('1.6 Modify TSM offices, adding one of them', () => {
        performLoginAsAdmin();

        adminPage.moveToTsmManagement();

        // now we have to select one of the existing technical office staff members :   
        adminPage.selectFisrtTsm();
        adminPage.selectFirstOffice();
        stubUpdateTsmOffices();
        adminPage.saveChanges();

        cy.wait('@updateTsmOffices');
    });

    it('1.7 modify TSM offices, removing one of them', () => {
        performLoginAsAdmin();

        adminPage.moveToTsmManagement();
        // now we have to select one of the existing technical office staff members :
        adminPage.selectFisrtTsm();
        adminPage.removeFirstOffice();
        stubUpdateTsmOffices();
        adminPage.saveChanges();

        cy.wait('@updateTsmOffices');
    });

    it.only('1.8 attempt to modify TSM office with no offices should lead to the non-ability to save changes', () => {
        performLoginAsAdmin();

        adminPage.moveToTsmManagement();
        adminPage.selectFisrtTsm();
        adminPage.removeTwoOffices();
        cy.get('[id="save-tsm-offices"]').should('be.disabled');
    });
})