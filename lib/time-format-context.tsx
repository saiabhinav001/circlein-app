'use client'

import { createContext, useContext } from 'react'
import type { TimeFormat } from './time-format'

const TimeFormatContext = createContext<TimeFormat>('24h')

export function TimeFormatProvider({
	children,
	format,
}: {
	children: React.ReactNode
	format: TimeFormat
}) {
	return (
		<TimeFormatContext.Provider value={format}>
			{children}
		</TimeFormatContext.Provider>
	)
}

export function useTimeFormat(): TimeFormat {
	return useContext(TimeFormatContext)
}
