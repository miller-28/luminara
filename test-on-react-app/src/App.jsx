// App.jsx - Main Orchestrator (UI COORDINATION ONLY)
// Coordinates components and controllers, manages React state sync

import React, { useState, useEffect } from 'react'
import ToastNotification from './components/ToastNotification'
import TestControls from './components/TestControls'
import TestConfiguration from './components/TestConfiguration'
import TestGrid from './components/TestGrid'
import LogsSection from './components/LogsSection'
import ScrollToTop from './components/ScrollToTop'
import TestController from './controllers/TestController'
import { testDefinitions, testConfiguration } from './data/testDefinitions'
import { api } from './services/luminaraService'

function App() {
	// React state management
	const [results, setResults] = useState({})
	const [logs, setLogs] = useState([])
	const [runningTests, setRunningTests] = useState(new Set())
	const [currentTestName, setCurrentTestName] = useState('')
	const [isRunning, setIsRunning] = useState(false)
	const [isRunningAll, setIsRunningAll] = useState(false)
	const [copySuccess, setCopySuccess] = useState(false)

	// Toast notification state
	const [showToast, setShowToast] = useState(false)
	const [toastMessage, setToastMessage] = useState('')
	const [toastType, setToastType] = useState('info')

	// Initialize controller once
	const [testController] = useState(() => {
		const controller = new TestController()
		
		// Set up callbacks for UI updates
		controller.setCallbacks({
			onStateChange: (newState) => {
				setRunningTests(newState.runningTests)
				setCurrentTestName(newState.currentTestName)
				setIsRunning(newState.isRunning)
				setIsRunningAll(newState.isRunningAll)
			},
			onLogsChange: (newLogs) => {
				setLogs(newLogs)
			},
			onResultsChange: (newResults) => {
				setResults(newResults)
			},
			onToastMessage: (message, type = 'info') => {
				showToastMessage(message, type)
			}
		})
		
		return controller
	})

	// Transform test definitions to include API client
	const testsWithApi = testDefinitions.map(test => ({
		...test,
		call: (abortSignal) => test.call(abortSignal, api)
	}))

	// Toast notification helper
	const showToastMessage = (message, type = 'info') => {
		setToastMessage(message)
		setToastType(type)
		setShowToast(true)
		setTimeout(() => setShowToast(false), 3000)
	}

	// Event handlers (delegate to controller)
	const handleRunTest = async (testIndex) => {
		await testController.runTest(testIndex, testsWithApi)
	}

	const handleRunAllTests = async () => {
		await testController.runAllTests(testsWithApi)
	}

	const handleStopCurrentTest = () => {
		testController.stopCurrentTest()
	}

	const handleStopTest = (testIndex) => {
		testController.stopTest(testIndex)
	}

	const handleCopyLogs = async () => {
		const success = await testController.copyLogs()
		if (success) {
			setCopySuccess(true)
			setTimeout(() => setCopySuccess(false), 2000)
		}
	}

	const handleClearLogs = () => {
		testController.clearLogs()
	}

	return (
		<div className="test-container">
			{/* Toast Notification */}
			<ToastNotification 
				showToast={showToast}
				toastMessage={toastMessage}
				toastType={toastType}
			/>
			
			<h1>🌌 Luminara React Testing</h1>
			<p>Testing luminara retry functionality in browser environment with clean component separation</p>
			
			{/* Test Configuration */}
			<TestConfiguration testsCount={testConfiguration.totalTests} />

			{/* Test Controls */}
			<TestControls
				isRunning={isRunning}
				isRunningAll={isRunningAll}
				onRunAllTests={handleRunAllTests}
				onStopCurrentTest={handleStopCurrentTest}
				currentTestName={currentTestName}
				testsCount={testConfiguration.totalTests}
			/>

			{/* Individual Tests Grid */}
			<TestGrid
				tests={testsWithApi}
				results={results}
				runningTests={runningTests}
				onRunTest={handleRunTest}
				onStopTest={handleStopTest}
			/>

			{/* Request Logs */}
			<LogsSection
				logs={logs}
				copySuccess={copySuccess}
				onCopyLogs={handleCopyLogs}
				onClearLogs={handleClearLogs}
			/>

			{/* Scroll to Top Button */}
			<ScrollToTop />
		</div>
	)
}

export default App