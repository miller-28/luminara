import React from 'react'

const ToastNotification = ({ showToast, toastMessage, toastType }) => {
	if (!showToast) return null

	const getBackgroundColor = () => {
		switch (toastType) {
			case 'success': return '#28a745'
			case 'warning': return '#ffc107'
			case 'error': return '#dc3545'
			default: return '#17a2b8'
		}
	}

	const getTextColor = () => {
		return toastType === 'warning' ? '#212529' : 'white'
	}

	return (
		<div 
			style={{
				position: 'fixed',
				top: '20px',
				right: '20px',
				background: getBackgroundColor(),
				color: getTextColor(),
				padding: '15px 20px',
				borderRadius: '8px',
				boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
				zIndex: 1000,
				animation: 'slideInRight 0.3s ease',
				fontSize: '14px',
				fontWeight: 'bold',
				minWidth: '250px',
				textAlign: 'center'
			}}
		>
			{toastMessage}
		</div>
	)
}

export default ToastNotification