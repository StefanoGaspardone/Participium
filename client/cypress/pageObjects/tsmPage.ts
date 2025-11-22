import { TSMPAGE_URL, HOMEPAGE_URL } from "../support/utils";
import { generateRandomString } from "./utils";

const tsmPage = {
    url: TSMPAGE_URL,

    getAssignedReports: () => {
        return cy.get('[id="report-title"]');
    }
}

export { tsmPage }