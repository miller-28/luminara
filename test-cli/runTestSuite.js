import { fileURLToPath } from 'url';

/**
 * Runs a test suite if the file is executed directly
 * @param {string} importMetaUrl - import.meta.url from the calling test file
 * @param {string} suiteName - Name of the test suite for console output
 * @param {Object} suite - Test suite instance
 * @param {Object} mockServer - Mock server instance
 * @param {Function} [beforeStart] - Optional function to run before starting mock server
 */
export async function runTestSuiteIfDirect(importMetaUrl, suiteName, suite, mockServer, beforeStart) {
	// Check if this file is being executed directly
	if (fileURLToPath(importMetaUrl) === process.argv[1]) {
		console.log(`🧪 Running ${suiteName} Tests...`);
		
		// Run any special setup before starting the server
		if (beforeStart) {
			beforeStart(mockServer);
		}
		
		await mockServer.start();
		
		try {
			const results = await suite.run();
			console.log(`✅ Tests completed: ${results.passed}/${results.total} passed`);
			process.exit(results.failed > 0 ? 1 : 0);
		} finally {
			await mockServer.stop();
		}
	}
}