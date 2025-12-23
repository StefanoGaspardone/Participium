import { TSMPAGE_URL } from "../support/utils";

const tsmPage = {
  url: TSMPAGE_URL,

  getAssignedReports: () => {
    return cy.get('[id="report-title"]');
  },
  expandReport: (title: string) => {
    return cy.contains(title).click();
  },
  startProgress: (title: string) => {
    cy.get('[id="switch-report-status' + title + '"]')
      .contains("Start Progress")
      .click();
  },
  markAsResolved: (title: string) => {
    cy.get('[id="switch-report-status' + title + '"]')
      .contains("Mark as Resolved")
      .click();
  },
  suspend: (title: string) => {
    cy.get('[id="switch-report-status' + title + '"]')
      .contains("Suspend")
      .click();
  },
  resumeProgress: (title: string) => {
    cy.get('[id="switch-report-status' + title + '"]')
      .contains("Resume Progress")
      .click();
  },
  isCurrentStatus: (status: string, title: string) => {
    cy.get('[id="current-status' + title + '"]').should("contain", status);
  },
  selectMaintainer: (reportId: number, maintainerId: number) => {
    cy.get(`#assign-maintainer-select-${reportId}`).select(String(maintainerId));
  },
  assignMaintainer: (reportId: number) => {
    cy.get(`#assign-maintainer-button-${reportId}`).click();
  },
  assignOutsideMaintainer: (reportId: number) => {
    cy.get(`#assign-outside-button-${reportId}`).click();
  },
  chatWithReporter: () => {
    cy.get('#chat-redirect-issuer').filter(':visible').click();
  },
  chatWithMaintainer: () => {
    cy.get('#chat-redirect-maintainer').filter(':visible').click();
  },
  verifyChatOpened: () => {
    cy.get('.chats-popover').should('be.visible');
  },
  sendMessage: (text: string) => {
    cy.get('.chat-input input').type(text);
    cy.get('.chat-input button').click();
  }
};

export { tsmPage };
