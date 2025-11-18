/// <reference types="cypress" />
import {HOMEPAGE_URL} from "../support/utils"

const homePage = {
    url: HOMEPAGE_URL,

    clickLogin: () => {
        cy.get('[id="login-1"]').focus().click();
    },
    clickLogin2: () => {
        cy.get('[id="login-2"]').focus().click();
    },
    clickNewReport: () => {
        cy.get('[id="upload-new-report-button"]').click();
    }
}

export { homePage }