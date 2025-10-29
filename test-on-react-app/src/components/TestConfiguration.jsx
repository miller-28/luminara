import React from 'react'

const TestConfiguration = ({ testsCount }) => {
	return (
		<div className="test-section">
			<h2>📋 Test Configuration</h2>
			<ul>
				<li><strong>Total Tests:</strong> {testsCount} comprehensive feature tests</li>
				<li><strong>Retries:</strong> 3 attempts</li>
				<li><strong>Delay:</strong> 1500ms linear backoff (default)</li>
				<li><strong>Retry Status Codes:</strong> [408, 429, 500, 502, 503, 504]</li>
				<li><strong>Environment:</strong> Browser (React + Vite)</li>
				<li><strong>Coverage:</strong> HTTP methods, content types, retries, backoff strategies, plugins, timeouts</li>
			</ul>
		</div>
	)
}

export default TestConfiguration