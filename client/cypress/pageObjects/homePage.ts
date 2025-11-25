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
    },
    clickNotifications: () => {
        cy.get('[id="notifications-toggle"]').click({force: true});
        cy.get('[id="report-updates"]').should('be.visible');
    }, 
    clickOnMap: () => {
        cy.get('[class="leaflet-interactive"]').click({force: true});
    }
}

export { homePage }