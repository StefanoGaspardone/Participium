import { ADMINPAGE_URL, HOMEPAGE_URL, LOGINPAGE_URL } from "../../support/utils";
import { loginPage } from "../../pageObjects/loginPage";
import { adminPage } from "../../pageObjects/adminPage";
import { generateRandomString } from "../../pageObjects/utils";

// Helpers: stubs and login
const makeToken = (user: any) => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ user, exp }));
    return `${header}.${payload}.`;
};

// prepare a reusable admin token so both login and /me return the same one
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
    // AppContext calls POST /api/users/me on first load; ensure it returns the token
    cy.intercept('POST', '/api/users/me', (req) => {
        req.reply({ statusCode: 200, body: { token: adminToken } });
    }).as('me');
};

const stubAdminPageData = () => {
    // Offices, Companies, Categories used to populate selects
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
        body: { categories: [
            { id: 1, name: 'Road' },
            { id: 2, name: 'Lighting' },
            { id: 3, name: 'Trash' },
        ]},
    }).as('getCategories');
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

const performLoginAsAdmin = () => {
    stubLoginAdmin();
    stubAdminPageData();
    
    cy.visit(LOGINPAGE_URL);
    
    loginPage.insertUsername('admin');
    loginPage.insertPassword('admin');
    loginPage.submitForm();
    
    cy.wait('@loginAdmin');
    // wait for the /me check and the data used by the admin page
    cy.wait('@me');
    cy.wait(['@getOffices', '@getCompanies', '@getCategories']);
    cy.url().should('equal', ADMINPAGE_URL);
};

describe("5. Test suite for the admin page (used to create new municipality users)", () => {
    it('5.1 Logging in as an admin should redirect me to the admin page', () => {
        performLoginAsAdmin();
    });

    it('5.2 As an admin, trying to visit another page, should redirect me to the admin page again', () => {
        performLoginAsAdmin();
        cy.visit(HOMEPAGE_URL);
        cy.url().should('equal', ADMINPAGE_URL);
    });

    it('5.3 Create Municipal Administrator', () => {
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

    it('5.4 Create Municipal Public Relations Officer', () => {
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

    it('5.5 Create Technical Office Staff Member', () => {
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

    it('5.6 Create new Company and then External Maintainer', () => {
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
})