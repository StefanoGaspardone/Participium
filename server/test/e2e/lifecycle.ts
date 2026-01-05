/**
 * E2E lifecycle setup for tests.
 * - initializes the test datasource (Postgres container defined in server/test/docker/postgres/docker-compose.yaml)
 * - populates some predefined roles and users
 * - tears down the datasource after tests
 */
import { initializeTestDatasource, closeTestDataSource, populateTestData, emptyTestData } from '../setup/test-datasource';

export default {
	async beforeAll() {
		// initialize DB and populate test data
		await initializeTestDatasource();
		// Clear any existing data first to avoid duplicates
		await emptyTestData();
		await populateTestData();
	},

	async afterAll() {
		// clear data and close DB connection
        await emptyTestData();
		await closeTestDataSource();
	}
};
