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
    checkChatsPopoverVisible: () => {
        cy.get('[id="chat-popover"]').should('be.visible');
    },
  sendMessage: (text: string) => {
    cy.get('.chat-input input').type(text);
    cy.get('.chat-input button').click();
  },
  // Image carousel helpers matching ExternalPage implementation
  // Inline prev/next buttons have aria-label="Previous image" / "Next image"
  // Fullscreen opens when clicking the report image (no aria-label on button)
  openReportLightbox: (title: string) => {
    cy.contains('h4#report-title', title)
      .closest('.accordion-item')
      .within(() => {
        cy.get('img[alt^="Report image"]').first().click({ force: true });
      });
  },
  clickInlineNextImage: (title: string) => {
    cy.contains('h4#report-title', title)
      .closest('.accordion-item')
      .within(() => {
        cy.get('button[aria-label="Next image"]').first().click({ force: true });
      });
  },
  clickInlinePrevImage: (title: string) => {
    cy.contains('h4#report-title', title)
      .closest('.accordion-item')
      .within(() => {
        cy.get('button[aria-label="Previous image"]').first().click({ force: true });
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

export { mntPage };
