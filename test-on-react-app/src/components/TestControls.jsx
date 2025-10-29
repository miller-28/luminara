import React from 'react'

const TestControls = ({ 
	isRunning, 
	isRunningAll, 
	onRunAllTests, 
	onStopCurrentTest, 
	currentTestName,
	testsCount 
}) => {
	const handleRunAllClick = (e) => {
		if (!isRunning && !isRunningAll) {
			e.target.style.transform = 'translateY(-3px) scale(1.02)'
			e.target.style.boxShadow = '0 6px 15px rgba(74, 144, 226, 0.4)'
			setTimeout(() => {
				e.target.style.transform = 'translateY(0) scale(1)'
				e.target.style.boxShadow = 'none'
			}, 150)
		}
		onRunAllTests()
	}

	const handleMouseEnter = (e) => {
		if (!isRunning && !isRunningAll) {
			e.target.style.transform = 'translateY(-3px) scale(1.02)'
			e.target.style.boxShadow = '0 6px 15px rgba(74, 144, 226, 0.4)'
		}
	}

	const handleMouseLeave = (e) => {
		if (!isRunning && !isRunningAll) {
			e.target.style.transform = 'translateY(0) scale(1)'
			e.target.style.boxShadow = 'none'
		}
	}

	return (
		<div className="test-section">
			<h2>🧪 Test Controls</h2>
			<div style={{ marginBottom: '15px' }}>
				<button
					className={`test-button ${isRunningAll ? 'button-running' : ''}`}
					style={{ 
						backgroundColor: isRunningAll ? '#666' : '#4a90e2',
						fontSize: '16px',
						fontWeight: 'bold',
						padding: '12px 24px',
						transform: isRunningAll ? 'none' : 'scale(1)',
						marginRight: '10px'
					}}
					disabled={isRunning || isRunningAll}
					onClick={handleRunAllClick}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
				>
					{isRunningAll ? '⏳ Running All Tests...' : `🚀 Run All Tests (${testsCount})`}
				</button>
				
				{(isRunning || isRunningAll) && (
					<button
						className="test-button"
						style={{
							backgroundColor: '#dc3545',
							color: 'white',
							fontSize: '14px',
							fontWeight: 'bold',
							padding: '10px 20px',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer',
							marginLeft: '10px'
						}}
						onClick={onStopCurrentTest}
						onMouseEnter={(e) => {
							e.target.style.backgroundColor = '#c82333'
							e.target.style.transform = 'translateY(-2px)'
						}}
						onMouseLeave={(e) => {
							e.target.style.backgroundColor = '#dc3545'
							e.target.style.transform = 'translateY(0)'
						}}
					>
						🛑 Stop {currentTestName ? `"${currentTestName}"` : 'Test'}
					</button>
				)}
			</div>
		</div>
	)
}

export default TestControls