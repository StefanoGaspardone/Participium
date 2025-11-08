/**
 * E2E lifecycle setup for tests.
 * - initializes the test datasource (Postgres container defined in server/test/docker/postgres/docker-compose.yaml)
 * - populates some predefined roles and users
 * - tears down the datasource after tests
 */
import { initializeTestDatasource, closeTestDataSource, populateTestData } from '../setup/test-datasource';

export default {
	async beforeAll() {
		// initialize DB and populate test data
		await initializeTestDatasource();
		await populateTestData();
	},

	async afterAll() {
		// close DB connection
		await closeTestDataSource();
	}
};
