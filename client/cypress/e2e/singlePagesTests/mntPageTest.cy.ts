import { loginPage } from "../../pageObjects/loginPage";
import { mntPage } from "../../pageObjects/mntPage";
import { LOGINPAGE_URL, MAINTAINERPAGE_URL } from "../../support/utils";

const makeToken = (user: any) => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ user, exp }));
    return `${header}.${payload}.`;
};

const mntUser = {
    id: 42,
    username: 'mntuser',
    email: 'mnt@example.test',
    firstName: 'Mnt',
    lastName: 'User',
    userType: 'EXTERNAL_MAINTAINER',
    emailNotificationsEnabled: true,
    company: { id: 1, name: "FixIt" }
};

const mntToken = makeToken(mntUser);

const tsmUser = {
    id: 99,
    username: 'tsmuser',
    firstName: 'Tsm',
    lastName: 'Staff',
    userType: 'TECHNICAL_STAFF_MEMBER'
};

const reportId = 202;
const reportTitle = "Broken Bench";
const report = {
    id: reportId,
    title: reportTitle,
    description: "Bench is broken",
    status: "Assigned",
    category: { id: 2, name: "Parks" },
    createdAt: new Date().toISOString(),
    lat: 45.1,
    long: 7.7,
    images: [
        'https://via.placeholder.com/800x600.png?text=BrokenBench+Image+1',
        'https://via.placeholder.com/800x600.png?text=BrokenBench+Image+2'
    ],
    createdBy: { id: 50, username: "citizen" },
    assignedTo: tsmUser, // The TSM who assigned it
    coAssignedTo: mntUser // The maintainer (me)
};

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
        cy.intercept('GET', '/api/reports/assigned', { statusCode: 200, body: { reports: [report] } }).as('getAssignedReports');
        cy.intercept('GET', '/api/notifications/my', { statusCode: 200, body: { notifications: [] } }).as('getNotifications');
        cy.intercept('GET', '/api/chats', { statusCode: 200, body: { chats: [] } }).as('getChats');
    });

    it('5.1 Logging in as an External Maintainer should lead to External Maintainer page', () => {
        performLoginAsMnt();
    });

    it('5.2 Clicking on brand/home should keep me on the MNT page', () => {
        performLoginAsMnt();
        cy.get('[id="to-homepage"]').click();
        cy.url().should('equal', MAINTAINERPAGE_URL);
    });

    it('5.3 Change report status', () => {
        performLoginAsMnt();
        cy.wait('@getAssignedReports');

        mntPage.expandReport(reportTitle);
        mntPage.isCurrentStatus("Assigned", reportTitle);

        cy.intercept('PUT', `/api/reports/${reportId}/status/technical`, (req) => {
            expect(req.body.status).to.equal('InProgress');
            req.reply({ statusCode: 200, body: { report: { ...report, status: 'InProgress' } } });
        }).as('updateStatusInProgress');

        mntPage.startProgress(reportTitle);
        cy.wait('@updateStatusInProgress');
        
        cy.intercept('PUT', `/api/reports/${reportId}/status/technical`, (req) => {
            expect(req.body.status).to.equal('Resolved');
            req.reply({ statusCode: 200, body: { report: { ...report, status: 'Resolved' } } });
        }).as('updateStatusResolved');

        mntPage.markAsResolved(reportTitle);
        cy.wait('@updateStatusResolved');
    });

    it('5.4 Chat with maintainer (Technical Staff)', () => {
        const chatWithTsm = {
            id: 5,
            report: { id: reportId, title: reportTitle },
            tosm_user: tsmUser,
            second_user: mntUser,
            messages: []
        };

        const mockMessages = [
            {
                id: 50,
                text: "Please fix this",
                sentAt: new Date().toISOString(),
                sender: tsmUser,
                receiver: mntUser,
                chat: chatWithTsm
            }
        ];

        cy.intercept('GET', '/api/chats', { statusCode: 200, body: { chats: [chatWithTsm] } }).as('getChatsWithTsm');
        cy.intercept('GET', `/api/chats/${chatWithTsm.id}/messages`, { statusCode: 200, body: { chats: mockMessages } }).as('getMessagesInitial');

        performLoginAsMnt();
        cy.wait('@getAssignedReports');
        mntPage.expandReport(reportTitle);

        mntPage.chatWithTechnicalStaff();
        mntPage.verifyChatOpened();
        cy.wait('@getMessagesInitial');
        cy.contains("Please fix this").should('be.visible');

        cy.intercept('POST', `/api/chats/${chatWithTsm.id}/newMessage`, (req) => {
            expect(req.body.text).to.equal('On it');
            req.reply({ statusCode: 200, body: { message: 'Message sent' } });
        }).as('sendMessage');

        const newMsg = {
            id: 51,
            text: "On it",
            sentAt: new Date().toISOString(),
            sender: mntUser,
            receiver: tsmUser,
            chat: chatWithTsm
        };
        cy.intercept('GET', `/api/chats/${chatWithTsm.id}/messages`, { statusCode: 200, body: { chats: [...mockMessages, newMsg] } }).as('getMessagesAfterSend');

        mntPage.sendMessage('On it');
        cy.wait('@sendMessage');
        cy.wait('@getMessagesAfterSend');
        cy.contains("On it").should('be.visible');
    });

    it('5.5 Image carousel for assigned report should open and navigate', () => {
        performLoginAsMnt();
        cy.wait('@getAssignedReports');

        mntPage.expandReport(reportTitle);
        // inline carousel navigation
        mntPage.clickInlineNextImage(reportTitle);
        mntPage.clickInlinePrevImage(reportTitle);

        // open fullscreen lightbox from the image
        mntPage.openReportLightbox(reportTitle);
        mntPage.lightboxShouldBeVisible();

        // close lightbox and verify it disappears
        mntPage.closeLightbox();
        cy.get('.yarl__container', { timeout: 5000 }).should('not.exist');
    });
});