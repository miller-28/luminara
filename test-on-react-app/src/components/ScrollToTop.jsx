// ScrollToTop.jsx - UI Component (PURE PRESENTATION)
// Provides scroll-to-top functionality with smooth animation

import React, { useState, useEffect } from 'react'

function ScrollToTop() {
	const [isVisible, setIsVisible] = useState(false)

	// Show button when user scrolls down 300px
	useEffect(() => {
		const toggleVisibility = () => {
			if (window.pageYOffset > 300) {
				setIsVisible(true)
			} else {
				setIsVisible(false)
			}
		}

		window.addEventListener('scroll', toggleVisibility)
		
		return () => {
			window.removeEventListener('scroll', toggleVisibility)
		}
	}, [])

	// Smooth scroll to top
	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		})
	}

	return (
		<>
			{isVisible && (
				<button
					onClick={scrollToTop}
					className="scroll-to-top"
					aria-label="Scroll to top"
					title="Scroll to top"
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M7 14L12 9L17 14"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
			)}
		</>
	)
}

export default ScrollToTop