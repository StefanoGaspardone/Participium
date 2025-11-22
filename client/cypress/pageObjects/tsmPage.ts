import { TSMPAGE_URL, HOMEPAGE_URL } from "../support/utils";
import { generateRandomString } from "./utils";

const statuses = ["Assigned", "InProgress", "Suspended", "Resolved"];

const tsmPage = {
  url: TSMPAGE_URL,

  getAssignedReports: () => {
    return cy.get('[id="report-title"]');
  },
  expandReport: (title: string) => {
    return cy.get('[id="expand-report-' + title + '"]').click({ force: true });
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
};

export { tsmPage };
