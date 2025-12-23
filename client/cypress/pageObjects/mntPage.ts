import { MAINTAINERPAGE_URL } from "../support/utils";

const mntPage = {
  url: MAINTAINERPAGE_URL,

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
  chatWithTechnicalStaff: () => {
    cy.get('#chat-redirect-technical-staff').filter(':visible').click();
  },
  verifyChatOpened: () => {
    cy.get('.chats-popover').should('be.visible');
  },
  sendMessage: (text: string) => {
    cy.get('.chat-input input').type(text);
    cy.get('.chat-input button').click();
  }
};

export { mntPage };
