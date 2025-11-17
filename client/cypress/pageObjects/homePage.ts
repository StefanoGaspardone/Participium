import {HOMEPAGE_URL} from "../support/utils"

const homePage = {
    url: HOMEPAGE_URL,

    clickLogin: () => {
        cy.get('[id="login-1"]').focus().click();
    },
    clickLogin2: () => {
        cy.get('[id="login-2"]').focus().click();
    }

}

export { homePage }