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
    checkChatsPopoverVisible: () => {
        cy.get('[id="chat-popover"]').should('be.visible');
    },
  sendMessage: (text: string) => {
    cy.get('.chat-input input').type(text);
    cy.get('.chat-input button').click();
  },
  checkOfficesDisplayed: (offices: string[]) => {
    offices.forEach((office) => {
      cy.get('#displayed-office').contains(office).should('be.visible');
    });
  },
  // Image carousel helpers (inline slider + fullscreen lightbox)
  openReportLightbox: (title: string) => {
    cy.contains('h4#report-title', title)
      .closest('.accordion-item')
      .within(() => {
        cy.get('button[aria-label="View report image in fullscreen"]').click({ force: true });
      });
  },
  clickInlineNextImage: (title: string) => {
    cy.contains('h4#report-title', title)
      .closest('.accordion-item')
      .within(() => {
        cy.get('button[aria-label="Next image"]').click({ force: true });
      });
  },
  clickInlinePrevImage: (title: string) => {
    cy.contains('h4#report-title', title)
      .closest('.accordion-item')
      .within(() => {
        cy.get('button[aria-label="Previous image"]').click({ force: true });
      });
  },
  lightboxShouldBeVisible: () => {
    cy.get('.yarl__container', { timeout: 10000 }).should('be.visible');
  },
  closeLightbox: () => {
    cy.get('body').type('{esc}');
  },
  
  clickNotifications: () => {
      cy.get('[id="notifications-toggle"]').first().click({ force: true });
  },
};

export { tsmPage };
