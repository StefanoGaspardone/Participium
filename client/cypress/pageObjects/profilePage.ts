/// <reference types="cypress" />

import { PROFILEPAGE_URL } from "../support/utils"

export const profilePage = {
    url: PROFILEPAGE_URL,

    clickEditProfile: () => {
        cy.get('[id="edit-profile-button"]').click();
    },
    insertFirstName: (firstName: string) => {
        cy.get('[id="firstName"]').clear().type(firstName);
    },
    checkFirstName: (firstName: string) => {
        cy.get('[id="firstname-current"]').should('contain', firstName);
    },
    insertLastName: (lastName: string) => {
        cy.get('[id="lastName"]').clear().type(lastName);
    },
    checkLastName: (lastName: string) => {
        cy.get('[id="lastname-current"]').should('contain', lastName);
    },
    insertUsername: (username: string) => {
        cy.get('[id="username"]').clear().type(username);
    },
    checkUsername: (username: string) => {
        cy.get('[id="username-current"]').should('contain', username);
    },
    insertEmail: (email: string) => {
        cy.get('[id="email"]').clear().type(email);
    },
    checkEmail: (email: string) => {
        cy.get('[id="email-current"]').should('contain', email);
    },
    insertTelegramUsername: (telegramUsername: string) => {
        cy.get('[id="telegramUsername"]').clear().type(telegramUsername);
    },
    checkTelegramUsername: (telegramUsername: string) => {
        cy.get('[id="telegram-current"]').should('contain', telegramUsername);
    },
    toggleEmailNotifications: () => {
        cy.get('[id="emailNotifications"]').check({ force: true});
    },
    checkEmailNotificationsChecked: () => {
        cy.get('[id="email-current"]').should('contain', "yes");
    },
    checkEmailNotificationsNotChecked: () => {
        cy.get('[id="email-current"]').should('contain', "no");
    },
    submitProfileChanges: () => {
        cy.get('[id="save-profile-button"]').click();
    },
    cancelProfileChanges: () => {
        cy.get('[id="cancel-edit-button"]').click();
    }
}
