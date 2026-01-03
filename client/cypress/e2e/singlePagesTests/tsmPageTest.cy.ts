import { loginPage } from "../../pageObjects/loginPage";
import { tsmPage } from "../../pageObjects/tsmPage";
import { LOGINPAGE_URL, TSMPAGE_URL } from "../../support/utils";

const makeToken = (user: any) => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ user, exp }));
    return `${header}.${payload}.`;
};

const tsmUser = {
    id: 42,
    username: 'tsmuser',
    email: 'tsm@example.test',
    firstName: 'Tsm',
    lastName: 'User',
    userType: 'TECHNICAL_STAFF_MEMBER',
    emailNotificationsEnabled: true,
    offices: ['Office A']
};

const tsmToken = makeToken(tsmUser);

const reportId = 101;
const reportTitle = "Broken Streetlight";
const report = {
    id: reportId,
    title: reportTitle,
    description: "Streetlight is flickering",
    status: "Assigned",
    category: { id: 1, name: "Infrastructure" },
    createdAt: new Date().toISOString(),
    lat: 45,
    long: 7.6,
    images: [
        'https://via.placeholder.com/800x600.png?text=Report+Image+1',
        'https://via.placeholder.com/800x600.png?text=Report+Image+2'
    ],
    createdBy: { id: 99, username: "citizen", firstName: "John", lastName: "Doe" },
    assignedTo: tsmUser
};

const maintainer = {
    id: 202,
    firstName: "Bob",
    lastName: "Builder",
    company: { name: "BuildIt Inc." },
    userType: "EXTERNAL_MAINTAINER"
};

const stubLoginTsm = () => {
    cy.intercept('POST', '/api/users/login', (req) => {
        req.reply({ statusCode: 200, body: { message: 'Login successful', token: tsmToken } });
    }).as('loginTSM');
};

const performLoginAsTsm = () => {
    stubLoginTsm();
    cy.visit(LOGINPAGE_URL);
    loginPage.insertUsername('tsmuser');
    loginPage.insertPassword('password');
    loginPage.submitForm();
    cy.wait('@loginTSM');
    cy.url().should('equal', TSMPAGE_URL);
};

describe("9. Test suite for Technical Staff Member", () => {
    beforeEach(() => {
        cy.intercept('POST', '/api/users/me', { statusCode: 401, body: { message: 'Unauthorized' } }).as('me');
        cy.intercept('GET', '/api/reports/assigned', { statusCode: 200, body: { reports: [report] } }).as('getAssignedReports');
        cy.intercept('GET', '/api/notifications/my', { statusCode: 200, body: { notifications: [] } }).as('getNotifications');
        cy.intercept('GET', '/api/chats', { statusCode: 200, body: { chats: [] } }).as('getChats');
    });

    it('9.1 Logging in as a Technical Staff Member should lead to Technical Staff Member page', () => {
        performLoginAsTsm();
    });

    it('9.2 Clicking on brand/home should keep me on the TSM page', () => {
        performLoginAsTsm();
        cy.get('[id="to-homepage"]').click();
        cy.url().should('equal', TSMPAGE_URL);
    });

    it('9.3 Change report status', () => {
        performLoginAsTsm();
        cy.wait('@getAssignedReports');

        tsmPage.expandReport(reportTitle);
        tsmPage.isCurrentStatus("Assigned", reportTitle);

        cy.intercept('PUT', `/api/reports/${reportId}/status/technical`, (req) => {
            expect(req.body.status).to.equal('InProgress');
            req.reply({ statusCode: 200, body: { report: { ...report, status: 'InProgress' } } });
        }).as('updateStatusInProgress');

        tsmPage.startProgress(reportTitle);
        cy.wait('@updateStatusInProgress');
        
        cy.intercept('PUT', `/api/reports/${reportId}/status/technical`, (req) => {
            expect(req.body.status).to.equal('Resolved');
            req.reply({ statusCode: 200, body: { report: { ...report, status: 'Resolved' } } });
        }).as('updateStatusResolved');

        tsmPage.markAsResolved(reportTitle);
        cy.wait('@updateStatusResolved');
    });

    it('9.4 Assign to maintainer', () => {
        performLoginAsTsm();
        cy.wait('@getAssignedReports');
        tsmPage.expandReport(reportTitle);

        cy.intercept('GET', `/api/users/maintainers?categoryId=${report.category.id}`, {
            statusCode: 200,
            body: [maintainer]
        }).as('getMaintainers');

        cy.get(`#assign-maintainer-select-${reportId}`).focus();
        cy.wait('@getMaintainers');

        cy.intercept('PUT', `/api/reports/${reportId}/assign-external`, (req) => {
            expect(req.body.maintainerId).to.equal(maintainer.id);
            req.reply({ statusCode: 200, body: { ...report, coAssignedTo: maintainer } });
        }).as('assignMaintainer');

        tsmPage.selectMaintainer(reportId, maintainer.id);
        tsmPage.assignMaintainer(reportId);
        cy.wait('@assignMaintainer');
    });

    it('9.5 Assign to external maintainer (out of participium)', () => {
        performLoginAsTsm();
        cy.wait('@getAssignedReports');
        tsmPage.expandReport(reportTitle);

        cy.intercept('PUT', `/api/reports/${reportId}/assign-external`, (req) => {
            expect(req.body.maintainerId).to.equal(13);
            req.reply({ statusCode: 200, body: { ...report, coAssignedTo: { id: 13, firstName: "External", lastName: "Maintainer" } } });
        }).as('assignOutside');

        tsmPage.assignOutsideMaintainer(reportId);
        cy.wait('@assignOutside');
    });

    it('9.6 Chat with the reporter', () => {
        const chatWithReporter = {
            id: 1,
            report: { id: reportId, title: reportTitle },
            tosm_user: tsmUser,
            second_user: report.createdBy,
            messages: []
        };

        const mockMessagesReporter = [
            {
                id: 10,
                text: "Hello from reporter",
                sentAt: new Date().toISOString(),
                sender: report.createdBy,
                receiver: tsmUser,
                chat: chatWithReporter
            },
            {
                id: 11,
                text: "Hello from TSM",
                sentAt: new Date().toISOString(),
                sender: tsmUser,
                receiver: report.createdBy,
                chat: chatWithReporter
            }
        ];

        cy.intercept('GET', '/api/chats', { statusCode: 200, body: { chats: [chatWithReporter] } }).as('getChatsWithReporter');
        cy.intercept('GET', `/api/chats/${chatWithReporter.id}/messages`, { statusCode: 200, body: { chats: mockMessagesReporter } }).as('getMessagesReporterInitial');

        performLoginAsTsm();
        cy.wait('@getAssignedReports');
        tsmPage.expandReport(reportTitle);

        tsmPage.chatWithReporter();
        tsmPage.verifyChatOpened();
        cy.wait('@getMessagesReporterInitial');

        cy.contains("Hello from reporter").should('be.visible');
        cy.contains("Hello from TSM").should('be.visible');

        cy.intercept('POST', `/api/chats/${chatWithReporter.id}/newMessage`, (req) => {
            expect(req.body.text).to.equal('Hello reporter');
            req.reply({ statusCode: 200, body: { message: 'Message sent' } });
        }).as('sendMessageToReporter');

        const newMsg = {
            id: 12,
            text: "Hello reporter",
            sentAt: new Date().toISOString(),
            sender: tsmUser,
            receiver: report.createdBy,
            chat: chatWithReporter
        };
        cy.intercept('GET', `/api/chats/${chatWithReporter.id}/messages`, { statusCode: 200, body: { chats: [...mockMessagesReporter, newMsg] } }).as('getMessagesReporterAfterSend');

        tsmPage.sendMessage('Hello reporter');
        cy.wait('@sendMessageToReporter');
        cy.wait('@getMessagesReporterAfterSend');
        cy.contains("Hello reporter").should('be.visible');
    });

    it('9.7 Chat with the maintainer', () => {
        const assignedReport = { ...report, coAssignedTo: maintainer };
        const chatWithMaintainer = {
            id: 2,
            report: { id: reportId, title: reportTitle },
            tosm_user: tsmUser,
            second_user: maintainer,
            messages: []
        };

        const mockMessagesMaintainer = [
            {
                id: 20,
                text: "Hello from maintainer",
                sentAt: new Date().toISOString(),
                sender: maintainer,
                receiver: tsmUser,
                chat: chatWithMaintainer
            }
        ];

        cy.intercept('GET', '/api/reports/assigned', { statusCode: 200, body: { reports: [assignedReport] } }).as('getAssignedReportsWithMaintainer');
        
        cy.intercept('GET', '/api/chats', { statusCode: 200, body: { chats: [chatWithMaintainer] } }).as('getChatsWithMaintainer');

        cy.intercept('GET', `/api/chats/${chatWithMaintainer.id}/messages`, { statusCode: 200, body: { chats: mockMessagesMaintainer } }).as('getMessagesMaintainerInitial');

        performLoginAsTsm();
        cy.wait('@getAssignedReportsWithMaintainer');
        tsmPage.expandReport(reportTitle);

        tsmPage.chatWithMaintainer();
        tsmPage.verifyChatOpened();
        cy.wait('@getMessagesMaintainerInitial');

        cy.contains("Hello from maintainer").should('be.visible');

        cy.intercept('POST', `/api/chats/${chatWithMaintainer.id}/newMessage`, (req) => {
            expect(req.body.text).to.equal('Hello maintainer');
            req.reply({ statusCode: 200, body: { message: 'Message sent' } });
        }).as('sendMessageToMaintainer');

        const newMsg = {
            id: 21,
            text: "Hello maintainer",
            sentAt: new Date().toISOString(),
            sender: tsmUser,
            receiver: maintainer,
            chat: chatWithMaintainer
        };
        cy.intercept('GET', `/api/chats/${chatWithMaintainer.id}/messages`, { statusCode: 200, body: { chats: [...mockMessagesMaintainer, newMsg] } }).as('getMessagesMaintainerAfterSend');

        tsmPage.sendMessage('Hello maintainer');
        cy.wait('@sendMessageToMaintainer');
        cy.wait('@getMessagesMaintainerAfterSend');
        cy.contains("Hello maintainer").should('be.visible');
    });

    it('9.8 A Technical Staff Member should see the served offices in the first tab of the page', () => {
        performLoginAsTsm();
        tsmPage.checkOfficesDisplayed(tsmUser.offices);
    });

    it('9.9 Image carousel for assigned report should open and navigate', () => {
        performLoginAsTsm();
        cy.wait('@getAssignedReports');

        tsmPage.expandReport(reportTitle);
        tsmPage.clickInlineNextImage(reportTitle);
        tsmPage.clickInlinePrevImage(reportTitle);

        tsmPage.openReportLightbox(reportTitle);
        tsmPage.lightboxShouldBeVisible();

        tsmPage.closeLightbox();
        cy.get('.yarl__container', { timeout: 5000 }).should('not.exist');
    });
});