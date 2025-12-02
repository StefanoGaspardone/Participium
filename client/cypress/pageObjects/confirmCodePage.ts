/// <reference types="cypress" />

import { CONFIRMPAGE_URL } from "../support/utils";

const confirmCodePage = {
    url: CONFIRMPAGE_URL,

    setUsername: (username: string) => cy.get('#username').clear().type(username),

    // Type code digits into OTP inputs (array of 6 chars)
    typeCode: (code: string) => {
        const digits = code.split('');
        digits.forEach((d, i) => {
            cy.get('.otp-input').eq(i).clear().type(d);
        });
    },

    // Simulate paste into the OTP container (the component listens on the wrapper div)
    pasteCode: (code: string) => {
        // Use Cypress trigger for clipboard paste so it works in the test runner
        cy.get('.d-flex.justify-content-center').trigger('paste', {
            clipboardData: {
                getData: () => code
            }
        });
    },

    submit: () => cy.get('#submit-button').should('not.be.disabled').click(),

    clickResend: () => cy.get('#resend-code').click(),

    // helper to check cooldown text when present
    getCooldownText: () => cy.contains(/^Resend available in \d+s$/),
};

export { confirmCodePage };
