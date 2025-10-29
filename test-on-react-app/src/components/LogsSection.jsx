import React from 'react'

const LogsSection = ({ 
	logs, 
	copySuccess, 
	onCopyLogs, 
	onClearLogs 
}) => {
	const handleCopyClick = () => {
		onCopyLogs()
	}

	const handleClearClick = () => {
		onClearLogs()
	}

	return (
		<div className="test-section">
			<div style={{ 
				display: 'flex', 
				justifyContent: 'space-between', 
				alignItems: 'center', 
				marginBottom: '15px' 
			}}>
				<h2>📋 Request Logs ({logs.length})</h2>
				<div>
					<button
						className={`test-button ${copySuccess ? 'button-success' : ''}`}
						onClick={handleCopyClick}
						style={{
							backgroundColor: copySuccess ? '#28a745' : '#17a2b8',
							fontSize: '12px',
							padding: '8px 16px',
							marginRight: '10px',
							transition: 'all 0.3s ease',
							transform: copySuccess ? 'scale(1.05)' : 'scale(1)'
						}}
						onMouseEnter={(e) => {
							if (!copySuccess) {
								e.target.style.backgroundColor = '#138496'
								e.target.style.transform = 'translateY(-2px)'
							}
						}}
						onMouseLeave={(e) => {
							if (!copySuccess) {
								e.target.style.backgroundColor = '#17a2b8'
								e.target.style.transform = 'translateY(0)'
							}
						}}
					>
						{copySuccess ? '✅ Copied!' : '📋 Copy Logs'}
					</button>
					<button
						className="test-button"
						onClick={handleClearClick}
						style={{
							backgroundColor: '#6c757d',
							fontSize: '12px',
							padding: '8px 16px'
						}}
						onMouseEnter={(e) => {
							e.target.style.backgroundColor = '#5a6268'
							e.target.style.transform = 'translateY(-2px)'
						}}
						onMouseLeave={(e) => {
							e.target.style.backgroundColor = '#6c757d'
							e.target.style.transform = 'translateY(0)'
						}}
					>
						🗑️ Clear Logs
					</button>
				</div>
			</div>
			
			<div style={{
				backgroundColor: '#1e1e1e',
				color: '#d4d4d4',
				padding: '15px',
				borderRadius: '8px',
				fontFamily: 'Consolas, Monaco, "Courier New", monospace',
				fontSize: '13px',
				lineHeight: '1.4',
				maxHeight: '400px',
				overflowY: 'auto',
				border: '1px solid #333'
			}}>
				{logs.length === 0 ? (
					<div style={{ color: '#888', fontStyle: 'italic' }}>
						No logs yet. Run some tests to see the results here.
					</div>
				) : (
					logs.map((logEntry, index) => (
						<div 
							key={index}
							style={{ 
								marginBottom: '5px',
								color: logEntry.type === 'success' ? '#4caf50' : 
									   logEntry.type === 'error' ? '#f44336' : 
									   logEntry.type === 'warning' ? '#ff9800' : '#d4d4d4'
							}}
						>
							<span style={{ color: '#888', marginRight: '10px' }}>
								[{logEntry.time}]
							</span>
							{logEntry.message}
						</div>
					))
				)}
			</div>
		</div>
	)
}

export default LogsSection