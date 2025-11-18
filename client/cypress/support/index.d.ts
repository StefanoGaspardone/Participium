export{}

declare namespace Cypress {
    interface Chainable<subject> {
        login(email: string, pwd: string): Chainable<any>
    }
}
