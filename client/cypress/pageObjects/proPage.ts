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
    cy.get('[id="click-expand-' + title + '"]').click({force: true});
  }
};

export { proPage }