import { TestController, examples } from './testController.js';

// UI Management - Only handles DOM manipulation and rendering
class SandboxUI {
	constructor() {
		this.container = document.getElementById('examples-container');
		this.runAllBtn = document.getElementById('run-all');
		this.clearAllBtn = document.getElementById('clear-all');
		this.outputElements = new Map();
		this.runButtonElements = new Map();
		this.stopButtonElements = new Map();
		
		this.testController = new TestController();

		this.init();
	}

	init() {
		this.renderExamples();
		this.attachEventListeners();
	}

	renderExamples() {
		for (const [featureKey, feature] of Object.entries(examples)) {
			const section = this.createFeatureSection(featureKey, feature);
			this.container.appendChild(section);
		}
	}

	createFeatureSection(featureKey, feature) {
		const section = document.createElement('div');
		section.className = 'feature-section';
		section.id = `feature-${featureKey}`;

		const header = document.createElement('div');
		header.className = 'feature-header';

		const title = document.createElement('div');
		title.className = 'feature-title';
		title.textContent = feature.title;

		const runFeatureBtn = document.createElement('button');
		runFeatureBtn.className = 'btn btn-small';
		runFeatureBtn.textContent = `▶ Run All ${feature.tests.length}`;
		runFeatureBtn.onclick = () => this.handleRunFeature(featureKey);

		header.appendChild(title);
		header.appendChild(runFeatureBtn);

		const grid = document.createElement('div');
		grid.className = 'examples-grid';

		for (const test of feature.tests) {
			const card = this.createExampleCard(test);
			grid.appendChild(card);
		}

		section.appendChild(header);
		section.appendChild(grid);

		return section;
	}

	createExampleCard(test) {
		const card = document.createElement('div');
		card.className = 'example-card';
		card.id = `example-${test.id}`;

		const cardHeader = document.createElement('div');
		cardHeader.className = 'example-header';

		const titleDiv = document.createElement('div');
		titleDiv.className = 'example-title';
		titleDiv.textContent = test.title;

		const buttonContainer = document.createElement('div');
		buttonContainer.style.display = 'flex';
		buttonContainer.style.gap = '8px';

		const runBtn = document.createElement('button');
		runBtn.className = 'btn btn-small';
		runBtn.textContent = '▶ Run';
		runBtn.onclick = () => this.handleRunTest(test.id);
		this.runButtonElements.set(test.id, runBtn);

		const stopBtn = document.createElement('button');
		stopBtn.className = 'btn btn-small btn-stop';
		stopBtn.textContent = '⏹ Stop';
		stopBtn.style.display = 'none';
		stopBtn.onclick = () => this.handleStopTest(test.id);
		this.stopButtonElements.set(test.id, stopBtn);

		buttonContainer.appendChild(runBtn);
		buttonContainer.appendChild(stopBtn);

		cardHeader.appendChild(titleDiv);
		cardHeader.appendChild(buttonContainer);

		const output = document.createElement('pre');
		output.className = 'example-output';
		output.textContent = 'Click ▶ Run to run this example';
		this.outputElements.set(test.id, output);

		card.appendChild(cardHeader);
		card.appendChild(output);

		return card;
	}

	attachEventListeners() {
		this.runAllBtn.onclick = () => this.handleRunAll();
		this.clearAllBtn.onclick = () => this.handleClearAll();
	}

	// UI Handlers - delegate logic to test controller
	async handleRunTest(testId) {
		const test = this.testController.findTest(testId);
		if (!test) return;

		const output = this.outputElements.get(testId);
		const runButton = this.runButtonElements.get(testId);
		const stopButton = this.stopButtonElements.get(testId);

		// Update output callback for live updates
		const updateOutput = (content) => {
			output.textContent = content;
		};

		// Status change callback for UI updates
		const onStatusChange = (status) => {
			switch (status) {
				case 'running':
					runButton.disabled = true;
					runButton.style.display = 'none';
					stopButton.style.display = 'inline-block';
					output.className = 'example-output running';
					output.textContent = `▶ Running ${test.title}...\nPlease wait...`;
					break;
				case 'success':
					output.className = 'example-output success';
					break;
				case 'error':
					output.className = 'example-output error';
					break;
				case 'stopped':
					output.className = 'example-output';
					break;
			}
		};

		// Run test
		const result = await this.testController.runTest(testId, updateOutput, onStatusChange);

		// Update UI based on result
		switch (result.status) {
			case 'success':
				output.textContent = `✅ Success\n\n${result.message}`;
				break;
			case 'error':
				output.textContent = `❌ Error\n\n${result.message}\n\nStack:\n${result.stack}`;
				break;
			case 'stopped':
				output.textContent = `⏹ Stopped\n\n${result.message}`;
				break;
		}

		// Reset buttons
		runButton.disabled = false;
		runButton.style.display = 'inline-block';
		stopButton.style.display = 'none';
	}

	handleStopTest(testId) {
		this.testController.stopTest(testId);
	}

	async handleRunFeature(featureKey) {
		await this.testController.runFeature(featureKey, (testId) => this.handleRunTest(testId));
	}

	async handleRunAll() {
		await this.testController.runAll((testId) => this.handleRunTest(testId));
	}

	handleClearAll() {
		// Stop all running tests
		this.testController.stopAll();

		// Clear all outputs
		for (const [testId, output] of this.outputElements) {
			output.className = 'example-output';
			output.textContent = 'Click ▶ Run to run this example';
			
			// Reset buttons
			const runButton = this.runButtonElements.get(testId);
			const stopButton = this.stopButtonElements.get(testId);
			if (runButton) {
				runButton.disabled = false;
				runButton.style.display = 'inline-block';
			}
			if (stopButton) {
				stopButton.style.display = 'none';
			}
		}
	}
}

// Initialize sandbox UI when DOM is ready
new SandboxUI();
