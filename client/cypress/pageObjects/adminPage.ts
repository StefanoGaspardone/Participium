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
}