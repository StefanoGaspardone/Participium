import { HOMEPAGE_URL, LOGINPAGE_URL, UPLOADREPORTPAGE_URL, REGISTERPAGE_URL, PROFILEPAGE_URL } from "../../support/utils";
import { homePage } from "../../pageObjects/homePage";
import { loginPage } from "../../pageObjects/loginPage";

const mockedChatResponse2 = [
	{
		"id": 1,
		"chatType": "citizen_tosm",
		"tosm_user": {
			"id": 4,
			"firstName": "Carmine",
			"lastName": "Conte",
			"email": "tsm1@part.se",
			"username": "tsm1",
			"image": null,
			"telegramUsername": null,
			"userType": "TECHNICAL_STAFF_MEMBER",
			"emailNotificationsEnabled": false,
			"offices": null,
			"company": null,
			"createdAt": "2025-12-27T09:58:50.975Z",
			"isActive": true
		},
		"second_user": {
			"id": 1,
			"firstName": "User",
			"lastName": "Test",
			"email": "user@example.test",
			"username": "user",
			"image": "https://res.cloudinary.com/dhzr4djkx/image/upload/v1766914654/participium/bsj6un9zip3tdvgxgwds.jpg",
			"telegramUsername": null,
			"userType": "CITIZEN",
			"emailNotificationsEnabled": true,
			"offices": null,
			"company": null,
			"createdAt": "2025-12-27T09:58:50.899Z",
			"isActive": true
		},
		"report": {
			"id": 5,
			"title": "UI Test - Report ",
			"description": "The mocked report for the ui tests",
			"category": { "id": 1, "name": "Water Supply - Drinking Water" },
			"images": [
				"https://res.cloudinary.com/dhzr4djkx/image/upload/v1766849234/participium/qdas0200sfqufpxsi83t.jpg"
			],
			"lat": 45.07400411,
			"long": 7.74326127,
			"status": "InProgress",
			"anonymous": false,
			"rejectedDescription": null,
			"createdBy": {
				"id": 1,
				"firstName": "User",
				"lastName": "Test",
				"email": "user@example.test",
				"username": "user",
				"image": "https://res.cloudinary.com/dhzr4djkx/image/upload/v1766914654/participium/bsj6un9zip3tdvgxgwds.jpg",
				"telegramUsername": null,
				"userType": "CITIZEN",
				"emailNotificationsEnabled": true,
				"offices": null,
				"company": null,
				"createdAt": "2025-12-27T09:58:50.899Z",
				"isActive": true
			},
			"assignedTo": {
				"id": 4,
				"firstName": "Carmine",
				"lastName": "Conte",
				"email": "tsm1@part.se",
				"username": "tsm1",
				"image": null,
				"telegramUsername": null,
				"userType": "TECHNICAL_STAFF_MEMBER",
				"emailNotificationsEnabled": false,
				"offices": null,
				"company": null,
				"createdAt": "2025-12-27T09:58:50.975Z",
				"isActive": true
			},
			"coAssignedTo": null,
			"createdAt": "2025-12-27T15:27:14.485Z"
		}
	}
];

const mockedChatResponse = [{ "id": 1, "chatType": "citizen_tosm", "tosm_user": { "id": 4, "firstName": "Carmine", "lastName": "Conte", "email": "tsm1@part.se", "username": "tsm1", "image": null, "telegramUsername": null, "userType": "TECHNICAL_STAFF_MEMBER", "emailNotificationsEnabled": false, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.975Z", "isActive": true }, "second_user": { "id": 3, "firstName": "Giacomo", "lastName": "Pirloaa", "email": "giack@five.se", "username": "giack.team5", "image": "https://res.cloudinary.com/dhzr4djkx/image/upload/v1766914654/participium/bsj6un9zip3tdvgxgwds.jpg", "telegramUsername": null, "userType": "CITIZEN", "emailNotificationsEnabled": true, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.899Z", "isActive": true }, "report": { "id": 5, "title": "aaaaa", "description": "aaaaaa", "category": { "id": 1, "name": "Water Supply - Drinking Water" }, "images": ["https://res.cloudinary.com/dhzr4djkx/image/upload/v1766849234/participium/qdas0200sfqufpxsi83t.jpg"], "lat": 45.07400411, "long": 7.74326127, "status": "InProgress", "anonymous": false, "rejectedDescription": null, "createdBy": { "id": 3, "firstName": "Giacomo", "lastName": "Pirloaa", "email": "giack@five.se", "username": "giack.team5", "image": "https://res.cloudinary.com/dhzr4djkx/image/upload/v1766914654/participium/bsj6un9zip3tdvgxgwds.jpg", "telegramUsername": null, "userType": "CITIZEN", "emailNotificationsEnabled": true, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.899Z", "isActive": true }, "assignedTo": { "id": 4, "firstName": "Carmine", "lastName": "Conte", "email": "tsm1@part.se", "username": "tsm1", "image": null, "telegramUsername": null, "userType": "TECHNICAL_STAFF_MEMBER", "emailNotificationsEnabled": false, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.975Z", "isActive": true }, "coAssignedTo": null, "createdAt": "2025-12-27T15:27:14.485Z" } }];

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
			emailNotificationsEnabled: true
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

describe("3. Test suite for home page :", () => {
	beforeEach(() => {
		cy.intercept('GET', '/api/users/me', { statusCode: 401, body: { message: 'Unauthorized' } }).as('meUnauthorized');
	});

	it("3.1 Login button should lead to right login page", () => {
		cy.visit(HOMEPAGE_URL);
		homePage.clickLogin();
		cy.url().should("equal", LOGINPAGE_URL);
	});

	it("3.2 Login link should lead to right login page", () => {
		cy.visit(HOMEPAGE_URL);
		homePage.clickLogin2();
		cy.url().should("equal", LOGINPAGE_URL);
	});

	it("3.3 As a logged user i should be able to click the map and select a location (identified b latitude and longitude)", () => {
		performLoginAsCitizen();

		cy.wait(['@reportsAssigned', '@reportsInProgress', '@reportsSuspended', '@reportsResolved']);
		cy.get('[alt="Marker"]').should('not.exist');
		homePage.clickOnMap();
		cy.get('[alt="Marker"]').should('be.visible');
	});

	it("3.4 As a logged user i should be able to go onto the upload a new report page", () => {
		performLoginAsCitizen();
		homePage.clickNewReport();
		cy.url().should("equal", UPLOADREPORTPAGE_URL);
	});

	it("3.5 As a logged user (citizen) I should be able to open notifications dropdown and see both the \"Report Updates\" and \"Messages\" sections", () => {
		performLoginAsCitizen();
		homePage.clickNotifications();
	});

	it("3.6 Register link should lead to right register page when not logged", () => {
		cy.visit(HOMEPAGE_URL);
		homePage.clickRegister();
		cy.url().should("equal", REGISTERPAGE_URL);
	});

	it("3.7 Profile button click should lead to profile page when logged", () => {
		performLoginAsCitizen();

		homePage.clickProfileDropdown();
		homePage.clickProfile();
		cy.url().should("equal", PROFILEPAGE_URL);
	});

	it("3.8 Logout button click should logout the user and redirect to home page", () => {
		performLoginAsCitizen();

		homePage.clickProfileDropdown();
		homePage.clickLogout();
		cy.url().should("equal", HOMEPAGE_URL);
	});

	it('3.9 Chat button click should be clickable and if clicked should lead to showing the chats', () => {
		performLoginAsCitizen();

		homePage.clickChats();
		homePage.checkChatsPopoverVisible();
	});

	it('3.10 The chat to appear should be the one correctly showing the other member name and surname got from the api call', () => {
		performLoginAsCitizen();

		cy.intercept('GET', '/api/chats', { statusCode: 200, body: [{ "id": 1, "chatType": "citizen_tosm", "tosm_user": { "id": 4, "firstName": "Carmine", "lastName": "Conte", "email": "tsm1@part.se", "username": "tsm1", "image": null, "telegramUsername": null, "userType": "TECHNICAL_STAFF_MEMBER", "emailNotificationsEnabled": false, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.975Z", "isActive": true }, "second_user": { "id": 3, "firstName": "Giacomo", "lastName": "Pirloaa", "email": "giack@five.se", "username": "giack.team5", "image": "https://res.cloudinary.com/dhzr4djkx/image/upload/v1766914654/participium/bsj6un9zip3tdvgxgwds.jpg", "telegramUsername": null, "userType": "CITIZEN", "emailNotificationsEnabled": true, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.899Z", "isActive": true }, "report": { "id": 5, "title": "aaaaa", "description": "aaaaaa", "category": { "id": 1, "name": "Water Supply - Drinking Water" }, "images": ["https://res.cloudinary.com/dhzr4djkx/image/upload/v1766849234/participium/qdas0200sfqufpxsi83t.jpg"], "lat": 45.07400411, "long": 7.74326127, "status": "InProgress", "anonymous": false, "rejectedDescription": null, "createdBy": { "id": 3, "firstName": "Giacomo", "lastName": "Pirloaa", "email": "giack@five.se", "username": "giack.team5", "image": "https://res.cloudinary.com/dhzr4djkx/image/upload/v1766914654/participium/bsj6un9zip3tdvgxgwds.jpg", "telegramUsername": null, "userType": "CITIZEN", "emailNotificationsEnabled": true, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.899Z", "isActive": true }, "assignedTo": { "id": 4, "firstName": "Carmine", "lastName": "Conte", "email": "tsm1@part.se", "username": "tsm1", "image": null, "telegramUsername": null, "userType": "TECHNICAL_STAFF_MEMBER", "emailNotificationsEnabled": false, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.975Z", "isActive": true }, "coAssignedTo": null, "createdAt": "2025-12-27T15:27:14.485Z" } }] }).as('getChats');

		homePage.clickChats();
		cy.wait('@getChats');
		homePage.checkChatsPopoverVisible();

		homePage.checkFirstChatOtherMember('Carmine Conte');

	});

	it.only('3.11 The messages should correctly appear after clicking on the desired chat', () => {
		performLoginAsCitizen();

		cy.intercept('GET', '/api/chats', { statusCode: 200, body: [{ "id": 1, "chatType": "citizen_tosm", "tosm_user": { "id": 4, "firstName": "Carmine", "lastName": "Conte", "email": "tsm1@part.se", "username": "tsm1", "image": null, "telegramUsername": null, "userType": "TECHNICAL_STAFF_MEMBER", "emailNotificationsEnabled": false, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.975Z", "isActive": true }, "second_user": { "id": 3, "firstName": "Giacomo", "lastName": "Pirloaa", "email": "giack@five.se", "username": "giack.team5", "image": "https://res.cloudinary.com/dhzr4djkx/image/upload/v1766914654/participium/bsj6un9zip3tdvgxgwds.jpg", "telegramUsername": null, "userType": "CITIZEN", "emailNotificationsEnabled": true, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.899Z", "isActive": true }, "report": { "id": 5, "title": "aaaaa", "description": "aaaaaa", "category": { "id": 1, "name": "Water Supply - Drinking Water" }, "images": ["https://res.cloudinary.com/dhzr4djkx/image/upload/v1766849234/participium/qdas0200sfqufpxsi83t.jpg"], "lat": 45.07400411, "long": 7.74326127, "status": "InProgress", "anonymous": false, "rejectedDescription": null, "createdBy": { "id": 3, "firstName": "Giacomo", "lastName": "Pirloaa", "email": "giack@five.se", "username": "giack.team5", "image": "https://res.cloudinary.com/dhzr4djkx/image/upload/v1766914654/participium/bsj6un9zip3tdvgxgwds.jpg", "telegramUsername": null, "userType": "CITIZEN", "emailNotificationsEnabled": true, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.899Z", "isActive": true }, "assignedTo": { "id": 4, "firstName": "Carmine", "lastName": "Conte", "email": "tsm1@part.se", "username": "tsm1", "image": null, "telegramUsername": null, "userType": "TECHNICAL_STAFF_MEMBER", "emailNotificationsEnabled": false, "offices": null, "company": null, "createdAt": "2025-12-27T09:58:50.975Z", "isActive": true }, "coAssignedTo": null, "createdAt": "2025-12-27T15:27:14.485Z" } }] }).as('getChats');
		cy.intercept('GET', '/api/chats/1/messages', { statusCode: 200, body: { "chats": [{ "id": 1, "text": "Buongiorno citizen", "sentAt": "2025-12-27T15:28:01.613Z", "sender": 4, "receiver": 1, "chat": 1 }] } });

		homePage.clickChats();
		cy.wait('@getChats');
		homePage.checkChatsPopoverVisible();

		homePage.checkFirstChatOtherMember('Carmine Conte');
		homePage.selectFirstChat();
		
		homePage.checkFirstMessageInChat('Buongiorno citizen');

	});
});