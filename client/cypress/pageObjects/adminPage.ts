import { ADMINPAGE_URL } from "../support/utils";

const adminPage = {
  url: ADMINPAGE_URL,

  insertFirstName: (fn: string) => {
    cy.get('[id="first-name"]').focus().type(fn);
  },
  insertLastName: (ln: string) => {
    cy.get('[id="last-name"]').focus().type(ln);
  },
  insertUsername: (un: string) => {
    cy.get('[id="username"]').focus().type(un);
  },
  insertEmail: (e: string) => {
    cy.get('[id="email"]').focus().type(e);
  },
  insertPassword: (pwd: string) => {
    cy.get('[id="password"]').focus().type(pwd);
  },
  /**
   * 
   * @param choice is related to the role (it's valid only if 0 <= choice <= 3)
   */
  selectRole: (choice: number) => {
    // react-select no longer exposes stable option ids — select by visible label
    const roleLabels = [
      "Municipal Administrator",
      "Municipal Public Relations Officer",
      "Technical Office Staff Member",
      "External Maintainer",
    ];
    if (choice < 0 || choice >= roleLabels.length) return;
    const label = roleLabels[choice];
    cy.get('#open-roles').click();
    // menu options are rendered under .rs__menu; pick the one that contains the label
    cy.get('.rs__menu').contains(label).click();
    cy.get('.rs__menu').should('not.exist');
  },
  /**
   * @param choice is related to the office (it's valid only if 1 <= choice <= 5)
   */
  selectOffice: (choice: number) => {
    if (choice < 1) return;
    cy.get('#open-offices').click();
    // select nth option (choice is 1-based index)
    cy.get('.rs__menu .rs__option').eq(choice - 1).click();
    cy.get('.rs__menu').should('not.exist');
  },
  /**
   * Select an existing company by id value
   */
  selectCompany: (choice: number) => {
    if (choice < 1) {
      return;
    }
    cy.get('#open-companies').click();
    // select by index (1-based)
    cy.get('.rs__menu .rs__option').eq(choice - 1).click();
    cy.get('.rs__menu').should('not.exist');
  },
  submitAccount: () => {
    cy.get('[id="create-account-button"]').focus().click();
  },

  clickHomepage: () => {
    cy.get('[id="to-homepage"]').click();
  },
  moveToTsmManagement: () => {
    cy.get('[id="section-offices-button"]').click();
  },
  selectFisrtTsm: () => {
    cy.get('#select-tsm').then(($select) => {
      // Open the dropdown
      cy.wrap($select).click({ force: true });
      // Select the first option
      cy.get('.rs__menu .rs__option').first().click({ force: true });
    });
  },
  selectFirstOffice: () => {
    cy.get('#select-add-office').then(($select) => {
      cy.get('#select-add-office').first().click({ force: true });
      // Open the dropdown
      cy.wrap($select).click({ force: true });
      // Select the first option
      cy.get('.rs__menu .rs__option').first().click({ force: true });
    });
  },
  saveChanges: () => {
    cy.get('[id="save-tsm-offices"]').click();
  },
  removeFirstOffice: () => {
    cy.get('[id="remove-office-1"]').first().click({ force: true });
  }
};

export { adminPage };
