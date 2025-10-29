import React from 'react'
import TestCard from './TestCard'

const TestGrid = ({ 
	tests, 
	results, 
	runningTests, 
	onRunTest,
	onStopTest
}) => {
	return (
		<div className="test-section">
			<h2>🧪 Individual Tests</h2>
			<div style={{ 
				display: 'grid', 
				gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
				gap: '15px',
				marginTop: '15px'
			}}>
				{tests.map((test, index) => (
					<TestCard
						key={index}
						test={test}
						testIndex={index}
						result={results[index]}
						isRunning={runningTests.has(index)}
						onRunTest={onRunTest}
						onStopTest={onStopTest}
					/>
				))}
			</div>
		</div>
	)
}

export default TestGrid