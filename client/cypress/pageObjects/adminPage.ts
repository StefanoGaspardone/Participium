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
    const roleIdByChoice: Record<number, string> = {
      0: "municipal_administrator",
      1: "public_relations_officer",
      2: "technical_staff_member",
      3: "external_maintainer",
    };
    if (choice < 0 || choice > 3) {
      return;
    }
    const optionId = roleIdByChoice[choice];
    cy.get('#open-roles').click();
    cy.get(`#${optionId}`).click();
  },
  /**
   * @param choice is related to the office (it's valid only if 1 <= choice <= 5)
   */
  selectOffice: (choice: number) => {
    if (choice < 1 || choice > 5) {
      return;
    }
    cy.get('#open-offices').click();
    cy.get(`#select-office${choice}`).click();
  },
  /**
   * Select an existing company by id value
   */
  selectCompany: (choice: number) => {
    if (choice < 1) {
      return;
    }
    cy.get('#open-companies').click();
    cy.get(`#select-company${choice}`).click();
  },
  submitAccount: () => {
    cy.get('[id="create-account-button"]').focus().click();
  },

  clickHomepage: () => {
    cy.get('[id="to-homepage"]').click();
  }
};

export { adminPage };
