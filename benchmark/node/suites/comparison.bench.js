/**
 * Fetch-family Client Comparison Benchmarks
 * Tests: Luminara against clients built on the Fetch API.
 */

export async function comparisonBenchmarks(bench, mockServer) {
	const [{ createLuminara }, kyModule, ofetchModule] = await Promise.all([
		import('../../../dist/index.mjs'),
		import('ky'),
		import('ofetch')
	]);

	const ky = kyModule.default;
	const { ofetch } = ofetchModule;
	const baseURL = `http://localhost:${mockServer.port}`;
	const jsonURL = `${baseURL}/json-small`;
	const textURL = `${baseURL}/text`;
	const payload = { data: 'test' };
	const luminara = createLuminara({ baseURL });
	const kyClient = ky.create({ prefixUrl: baseURL, retry: 0, timeout: false });

	bench.add('Compare - native fetch GET JSON', async () => {
		const response = await fetch(jsonURL);
		await response.json();
	});

	bench.add('Compare - luminara GET JSON', async () => {
		await luminara.getJson('/json-small');
	});

	bench.add('Compare - ky GET JSON', async () => {
		await kyClient.get('json-small').json();
	});

	bench.add('Compare - ofetch GET JSON', async () => {
		await ofetch(jsonURL);
	});

	bench.add('Compare - native fetch POST JSON', async () => {
		const response = await fetch(jsonURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		await response.json();
	});

	bench.add('Compare - luminara POST JSON', async () => {
		await luminara.postJson('/json-small', payload);
	});

	bench.add('Compare - ky POST JSON', async () => {
		await kyClient.post('json-small', { json: payload }).json();
	});

	bench.add('Compare - ofetch POST JSON', async () => {
		await ofetch(jsonURL, { method: 'POST', body: payload });
	});

	bench.add('Compare - native fetch GET text', async () => {
		const response = await fetch(textURL);
		await response.text();
	});

	bench.add('Compare - luminara GET text', async () => {
		await luminara.getText('/text');
	});

	bench.add('Compare - ky GET text', async () => {
		await kyClient.get('text').text();
	});

	bench.add('Compare - ofetch GET text', async () => {
		await ofetch(textURL, { responseType: 'text' });
	});
}
