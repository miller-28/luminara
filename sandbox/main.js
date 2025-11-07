import { ExamplesController, examples } from './examplesController.js';

// Code Modal Manager - Handles modal display and interactions
class CodeModal {
	
	constructor() {
		this.modal = document.getElementById('code-modal');
		this.modalTitle = document.getElementById('modal-title');
		this.modalCode = document.getElementById('modal-code');
		this.closeBtn = document.getElementById('modal-close');
		this.copyBtn = document.getElementById('modal-copy');
		
		this.init();
	}

	init() {

		// Close modal on close button click
		this.closeBtn.onclick = () => this.close();
		
		// Close modal on backdrop click
		this.modal.onclick = (e) => {
			if (e.target === this.modal) {
				this.close();
			}
		};
		
		// Close modal on Escape key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.modal.classList.contains('show')) {
				this.close();
			}
		});
		
		// Copy code on copy button click
		this.copyBtn.onclick = () => this.copyCode();
	}

	open(title, code) {
		this.modalTitle.textContent = title;
		this.modalCode.textContent = code;
		this.modal.classList.add('show');
		document.body.style.overflow = 'hidden'; // Prevent background scroll
	}

	close() {
		this.modal.classList.remove('show');
		document.body.style.overflow = ''; // Restore scroll
	}

	async copyCode() {
		const code = this.modalCode.textContent;
		try {
			await navigator.clipboard.writeText(code);

			// Visual feedback
			const originalText = this.copyBtn.textContent;
			this.copyBtn.textContent = '✅ Copied!';
			this.copyBtn.style.background = '#48bb78';
			setTimeout(() => {
				this.copyBtn.textContent = originalText;
				this.copyBtn.style.background = '';
			}, 2000);
		} catch (err) {
			console.error('Failed to copy code:', err);
			alert('Failed to copy code to clipboard');
		}
	}

}

// UI Management - Only handles DOM manipulation and rendering
class SandboxUI {

	constructor() {
		this.container = document.getElementById('examples-container');
		this.runAllBtn = document.getElementById('run-all');
		this.clearAllBtn = document.getElementById('clear-all');
		this.verboseToggle = document.getElementById('verbose-toggle');
		this.outputElements = new Map();
		this.runButtonElements = new Map();
		this.stopButtonElements = new Map();
		
		this.examplesController = new ExamplesController();
		this.codeModal = new CodeModal();

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
		runFeatureBtn.textContent = `▶ Run All ${feature.examples.length}`;
		runFeatureBtn.onclick = () => this.handleRunFeature(featureKey);

		header.appendChild(title);
		header.appendChild(runFeatureBtn);

		const grid = document.createElement('div');
		grid.className = 'examples-grid';

		for (const example of feature.examples) {
			const card = this.createExampleCard(example);
			grid.appendChild(card);
		}

		section.appendChild(header);
		section.appendChild(grid);

		return section;
	}

	createExampleCard(example) {
		const card = document.createElement('div');
		card.className = 'example-card';
		card.id = `example-${example.id}`;

		const cardHeader = document.createElement('div');
		cardHeader.className = 'example-header';

		const titleDiv = document.createElement('div');
		titleDiv.className = 'example-title';
		titleDiv.textContent = example.title;

		const buttonContainer = document.createElement('div');
		buttonContainer.style.display = 'flex';
		buttonContainer.style.gap = '8px';

		// Code button (if example has code)
		if (example.code) {
			const codeBtn = document.createElement('button');
			codeBtn.className = 'example-code-btn';
			codeBtn.innerHTML = '📄 Code';
			codeBtn.onclick = () => this.handleShowCode(example.title, example.code);
			buttonContainer.appendChild(codeBtn);
		}

		const runBtn = document.createElement('button');
		runBtn.className = 'btn btn-small';
		runBtn.textContent = '▶ Run';
		runBtn.onclick = () => this.handleRunTest(example.id);
		this.runButtonElements.set(example.id, runBtn);

		const stopBtn = document.createElement('button');
		stopBtn.className = 'btn btn-small btn-stop';
		stopBtn.textContent = '⏹ Stop';
		stopBtn.style.display = 'none';
		stopBtn.onclick = () => this.handleStopTest(example.id);
		this.stopButtonElements.set(example.id, stopBtn);

		buttonContainer.appendChild(runBtn);
		buttonContainer.appendChild(stopBtn);

		cardHeader.appendChild(titleDiv);
		cardHeader.appendChild(buttonContainer);

		const output = document.createElement('pre');
		output.className = 'example-output';
		output.textContent = 'Click ▶ Run to run this example';
		this.outputElements.set(example.id, output);

		card.appendChild(cardHeader);
		card.appendChild(output);

		return card;
	}

	attachEventListeners() {
		this.runAllBtn.onclick = () => this.handleRunAll();
		this.clearAllBtn.onclick = () => this.handleClearAll();
		this.verboseToggle.addEventListener('change', (e) => this.handleVerboseToggle(e.target.checked));
	}

	// UI Handlers - delegate logic to examples controller
	handleShowCode(title, code) {
		this.codeModal.open(title, code);
	}

	async handleRunTest(testId) {
		const example = this.examplesController.findExample(testId);
		if (!example) {
			return;
		}

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
					output.textContent = `▶ Running ${example.title}...\nPlease wait...`;
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

		// Run example
		const result = await this.examplesController.runExample(testId, updateOutput, onStatusChange);

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
		this.examplesController.stopExample(testId);
	}

	async handleRunFeature(featureKey) {
		await this.examplesController.runFeature(featureKey, (exampleId) => this.handleRunTest(exampleId));
	}

	async handleRunAll() {
		await this.examplesController.runAll((exampleId) => this.handleRunTest(exampleId));
	}

	handleClearAll() {

		// Stop all running examples
		this.examplesController.stopAll();

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

	handleVerboseToggle(isVerbose) {

		// Update examples controller with verbose state
		this.examplesController.setVerboseMode(isVerbose);
		
		// Update UI to show verbose state
		const toggleLabel = document.querySelector('.toggle-label');
		if (isVerbose) {
			toggleLabel.textContent = '🔍 Verbose Logging (Active)';
			console.info('🔍 [Sandbox] Verbose logging enabled - check console for detailed logs');
		} else {
			toggleLabel.textContent = '🔍 Verbose Logging';
			console.info('🔍 [Sandbox] Verbose logging disabled');
		}
	}

}

// Scroll to Top Button Manager
class ScrollToTop {
	
	constructor() {
		this.button = document.getElementById('scroll-to-top');
		this.init();
	}

	init() {
		// Check initial scroll position
		this.updateVisibility();
		
		// Show/hide button based on scroll position
		window.addEventListener('scroll', () => {
			this.updateVisibility();
		});
		
		// Scroll to top on button click
		this.button.addEventListener('click', () => {
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		});
	}

	updateVisibility() {
		if (window.scrollY > 300) {
			this.button.classList.add('visible');
		} else {
			this.button.classList.remove('visible');
		}
	}

}

// Scroll to Bottom Button Manager
class ScrollToBottom {
	
	constructor() {
		this.button = document.getElementById('scroll-to-bottom');
		this.init();
	}

	init() {
		// Check initial scroll position
		this.updateVisibility();
		
		// Show/hide button based on scroll position
		window.addEventListener('scroll', () => {
			this.updateVisibility();
		});
		
		// Scroll to bottom on button click
		this.button.addEventListener('click', () => {
			window.scrollTo({
				top: document.documentElement.scrollHeight,
				behavior: 'smooth'
			});
		});
	}

	updateVisibility() {
		if (window.scrollY < 100) {
			this.button.classList.add('visible');
		} else {
			this.button.classList.remove('visible');
		}
	}

}

// Initialize sandbox UI when DOM is ready
new SandboxUI();

// Initialize scroll to top button
new ScrollToTop();

// Initialize scroll to bottom button
new ScrollToBottom();
