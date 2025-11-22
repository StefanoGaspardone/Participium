/// <reference types="cypress" />
import { UPLOADREPORTPAGE_URL } from "../support/utils";

const reportPage = {
  url: UPLOADREPORTPAGE_URL,

  clickHomepage: () => {
    cy.get('[id="go-to-homepage-button"]').click();
  },
  insertTitle: (t: string) => {
    cy.get('[id="title-field"]').click().type(t);
  },
  insertDescription: (d: string) => {
    cy.get('[id="description-field"]').click().type(d);
  },
  /**
   * 
   * @param cat refers to a category, 0 <= cat <= 8
   */
  selectCategory: (cat: number) => {
    // valid only if 0 <= number <= 8
    if (cat < 0 || cat > 8) {
      return;
    }
    cy.get('[id="select-category"]').select(cat);
  },
  clickOnMap: () => {
    cy.get('[id="map-container"]').focus().click();
  },
  clickRandomOnMap: () => {
    cy.get('[id="map-container"]').focus().click(331, 765, {force: true});
  },
  /**
   * 
   * @param qty is the number of images to insert 0 <= qty <= 3
   */
  insertImages: (qty: number) => {
    if (qty < 1 || qty > 3) {
      return;
    }
    cy.get('[id="image-input"]').selectFile("cypress\\e2e\\singlePagesTests\\toUploadImages\\toUp.png", {force: true});
  }, //
  submitForm: () => {
    cy.get('[id="submit-button"]').click();
  },
  submitFormNotVisible: () => {
    cy.get('[id="submit-button"]').should('be.disabled');
  },
  acceptAlertValid: () => {
    cy.on("window:confirm", (text) => {
      expect(text).to.contain("Report successfully created!");
      return true; // simula click su OK
    });
  },
};

export { reportPage };
