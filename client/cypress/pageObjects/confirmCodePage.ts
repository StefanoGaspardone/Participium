/// <reference types="cypress" />

import { CONFIRMPAGE_URL } from "../support/utils";

const confirmCodePage = {
    url: CONFIRMPAGE_URL,

    setUsername: (username: string) => cy.get('#username').clear().type(username),

    elements: {
        username: () => cy.get('#username'),
        otpContainer: () => cy.get('#otp-container'),
        otpDigit: (i: number) => cy.get(`#otp-digit-${i}`),
        submitButton: () => cy.get('#submit-button'),
        resendLink: () => cy.get('#resend-code'),
        cooldownText: () => cy.get('#cooldown-text'),
    },

    typeCode: (code: string) => {
        const digits = code.split('');
        digits.forEach((d, i) => {
            confirmCodePage.elements.otpDigit(i).clear().type(d);
        });
    },

    pasteCode: (code: string) => {
        confirmCodePage.elements.otpContainer().trigger('paste', {
            clipboardData: {
                getData: () => code
            }
        });
    },

    submit: () => confirmCodePage.elements.submitButton().should('not.be.disabled').click(),

    clickResend: () => confirmCodePage.elements.resendLink().click(),

    getCooldownText: () => confirmCodePage.elements.cooldownText(),
};

export { confirmCodePage };
