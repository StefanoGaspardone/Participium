import { HOMEPAGE_URL, ADMINPAGE_URL, LOGINPAGE_URL } from "../support/utils";

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
    let role: string = "";
    if (choice < 0 && choice > 3) {
        return;
    }
    if (choice === 0) {
      role = "MUNICIPAL_ADMINISTRATOR";
    } else if (choice === 1) {
      role = "PUBLIC_RELATIONS_OFFICER";
    } else if (choice === 2) {
      role = "TECHNICAL_STAFF_MEMBER";
    }
    cy.get('[id="open-roles"]').focus().select(role);
  },
  /**
   * @param choice is related to the office (it's valid only if 1 <= choice <= 5)
   */
  selectOffice: (choice: number) => {
    if (choice < 1 && choice > 5) {
        return;
    } else {
        cy.get('[id="open-offices"]').focus().select(choice.toString());
    }
  },
  submitReport: () => {
    cy.get('[id="create-account-button"]').focus().click();
  }
};

export { adminPage };
