import React from 'react'

const TestCard = ({ 
	test, 
	testIndex, 
	result, 
	isRunning, 
	onRunTest,
	onStopTest
}) => {
	const getStatusEmoji = () => {
		if (isRunning) return '⏳'
		if (!result) return '⚪'
		return result.success ? '✅' : '❌'
	}

	const getCardStyle = () => {
		const baseStyle = {
			border: '2px solid #ddd',
			borderRadius: '8px',
			padding: '15px',
			marginBottom: '10px',
			backgroundColor: '#f9f9f9'
		}

		if (isRunning) {
			return {
				...baseStyle,
				borderColor: '#4a90e2',
				backgroundColor: '#e3f2fd',
				animation: 'pulse 2s infinite'
			}
		}

		if (result) {
			return {
				...baseStyle,
				borderColor: result.success ? '#28a745' : '#dc3545',
				backgroundColor: result.success ? '#d4edda' : '#f8d7da'
			}
		}

		return baseStyle
	}

	const handleRunClick = () => {
		onRunTest(testIndex)
	}

	const handleStopClick = () => {
		onStopTest(testIndex)
	}

	return (
		<div style={getCardStyle()}>
			<div style={{ 
				display: 'flex', 
				justifyContent: 'space-between', 
				alignItems: 'center',
				marginBottom: '10px'
			}}>
				<h4 style={{ margin: 0, color: '#333' }}>
					{getStatusEmoji()} {test.name}
				</h4>
				<div style={{ display: 'flex', gap: '8px' }}>
					<button
						className="test-button"
						disabled={isRunning}
						onClick={handleRunClick}
						style={{
							backgroundColor: isRunning ? '#666' : '#28a745',
							fontSize: '12px',
							padding: '6px 12px'
						}}
					>
						{isRunning ? '🔄 Running...' : '▶️ Run'}
					</button>
					{isRunning && (
						<button
							className="test-button"
							onClick={handleStopClick}
							style={{
								backgroundColor: '#dc3545',
								color: 'white',
								fontSize: '12px',
								padding: '6px 12px',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer'
							}}
							onMouseEnter={(e) => {
								e.target.style.backgroundColor = '#c82333'
								e.target.style.transform = 'translateY(-1px)'
							}}
							onMouseLeave={(e) => {
								e.target.style.backgroundColor = '#dc3545'
								e.target.style.transform = 'translateY(0)'
							}}
						>
							🛑 Stop
						</button>
					)}
				</div>
			</div>
			
			<p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
				<strong>Expected:</strong> {test.expected}
			</p>
			
			{result && (
				<div style={{ marginTop: '10px' }}>
					<p style={{ 
						margin: '5px 0', 
						color: result.success ? '#155724' : '#721c24',
						fontSize: '14px',
						fontWeight: 'bold'
					}}>
						<strong>Result:</strong> {result.message}
					</p>
					{result.duration && (
						<p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>
							Duration: {result.duration}ms
						</p>
					)}
					{result.retryAnalysis && (
						<p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>
							{result.retryAnalysis}
						</p>
					)}
				</div>
			)}
		</div>
	)
}

export default TestCard