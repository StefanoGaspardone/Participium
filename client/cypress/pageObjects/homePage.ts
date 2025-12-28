/// <reference types="cypress" />
import { HOMEPAGE_URL } from "../support/utils"

const homePage = {
    url: HOMEPAGE_URL,

    clickLogin: () => {
        cy.get('[id="login-1"]').focus().click();
    },
    clickLogin2: () => {
        cy.get('[id="login-2"]').focus().click();
    },
    clickRegister: () => {
        cy.get('[id="register-redirect"]').focus().click();
    },
    clickNewReport: () => {
        cy.get('[id="upload-new-report-button"]').click();
    },
    clickNotifications: () => {
        cy.get('[id="notifications-toggle"]').first().click({ force: true });
        cy.get('[id="section-reports-button"]').should('be.visible');
        cy.get('[id="section-messages-button"]').should('be.visible');
    },
    clickOnMap: () => {
        cy.get('[class="leaflet-interactive"]').click({ force: true });
    },
    clickProfileDropdown: () => {
        cy.get('[id="profile-dropdown"]').click({ force: true });
    },
    clickLogout: () => {
        cy.get('[id="logout-button"]').click({ force: true });
    },
    clickProfile: () => {
        cy.get('[id="profile-button"]').click({ force: true });
    },
    clickChats: () => {
        cy.get('[id="open-chat-button"]').click({ force: true });
    },
    checkChatsPopoverVisible: () => {
        cy.get('[id="chat-popover"]').should('be.visible');
    },
    checkFirstChatOtherMember: (nameSurname: string) => {
        cy.get('[id="user-details"]').first().should('contain.text', nameSurname);
    }
}

export { homePage }