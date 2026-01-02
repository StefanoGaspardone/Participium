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
    },
    selectFirstChat: () => {
        cy.get('[id="chat-button"]').first().click({ force: true });
    },
    checkFirstMessageInChat: (message: string) => {
        cy.get('[id="message-text"]').first().should('contain.text', message);
    },
    insertAddressInSearchbar: (addr: string) => {
        cy.get('[id="map-search-input"]').focus().type(addr);
    },
    clickSearchForAddress: () => {
        cy.get('[id="map-search-button"]').click();
    },
    checkIfNotVisiblePopupOnMap: () => {
        cy.get('[class="leaflet-popup-content-wrapper"]').should('not.exist');
    },
    checkIfVisiblePopupOnMap: () => {
        cy.get('[class="leaflet-popup-content-wrapper"]').should('be.visible');
    },
    // search for the toaster popup when no address is found
    checkNoAddressFoundPopup: () => {
        cy.get('[class="go3958317564"]').should('contain.text', 'No address found');
    },
    checkNoAddressInsertedPopup: () => {
        cy.get('[class="go3958317564"]').should('contain.text', 'Please enter an address');
    },
    clickLegendaButton: () => {
        cy.get('[id="map-legend-r0-toggle"]').click();
    },
    checkAllLegendItemsNotVisible: () => {
        cy.get('[id="map-legend-r0-status-assigned"]').should('not.exist');
        cy.get('[id="map-legend-r0-status-inprogress"]').should('not.exist');
        cy.get('[id="map-legend-r0-status-suspended"]').should('not.exist');
        cy.get('[id="map-legend-r0-status-resolved"]').should('not.exist');
    },
    checkAllLegendItemsVisible: () => {
        cy.get('[id="map-legend-r0-status-assigned"]').should('be.visible');
        cy.get('[id="map-legend-r0-status-inprogress"]').should('be.visible');
        cy.get('[id="map-legend-r0-status-suspended"]').should('be.visible');
        cy.get('[id="map-legend-r0-status-resolved"]').should('be.visible');
    },
    checkMapNotVisible: () => {
        cy.get('[id="map-container"]').should('not.exist');    
    },
    clickSeeMap : () => {
        cy.get('[id="see-map"]').click();
    },
    checkMapVisible: () => {
        cy.get('[id="map-container"]').should('be.visible');
    }

}

export { homePage }