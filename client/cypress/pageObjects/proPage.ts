/// <reference types="cypress" />
import {
  REGISTERPAGE_URL,
  LOGINPAGE_URL,
  HOMEPAGE_URL,
  PUBRELOFFPAGE_URL,
} from "../support/utils";
import { generateRandomString } from "./utils";

const proPage = {
  url: PUBRELOFFPAGE_URL,

  clickAccept: (title: string) => {
    cy.get('[id="accept-button' + title + '"]').focus().click({force: true});
  },
  clickReject: (title: string) => {
    cy.get('[id="reject-button' + title + '"]').focus().click({force: true});
  },
  insertRejectReason: (title: string) => {
    cy.get('[id="description-field' + title + '"]').type(generateRandomString(20), {force: true});
  },
  /**
   * 
   * @param cat refers to the id of category (0 <= cat <= 8)
   */
  changeCategory: (cat: number) => {
    if (cat < 0 || cat > 8) return;
    cy.get('[id="select-category"]').select(cat);
  },
  reportShouldExist: (title: string) => {
    return cy.get('[id="report-title-' + title + '"]').should('exist');
  },
  reportShouldNotExist: (title: string) => {
    return cy.get('[id="report-title-' + title + '"]').should('not.exist');
  },
  expandReport: (title: string) => {
    cy.contains('h4[id^="report-title-"]', title).click({ force: true });
  },
  // Image carousel helpers (inline slider + fullscreen lightbox)
  openReportLightbox: (title: string) => {
    cy.contains('h4[id^="report-title-"]', title)
      .closest('.accordion-item')
      .within(() => {
        cy.get('button[aria-label="Open image fullscreen"]').click({ force: true });
      });
  },
  clickInlineNextImage: (title: string) => {
    cy.contains('h4[id^="report-title-"]', title)
      .closest('.accordion-item')
      .within(() => {
        cy.get('button[aria-label="Next image"]').click({ force: true });
      });
  },
  clickInlinePrevImage: (title: string) => {
    cy.contains('h4[id^="report-title-"]', title)
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
  }
};

export { proPage }