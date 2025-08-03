'use client'

import { useState, useCallback, useEffect } from 'react'

interface UseSidebarOptions {
  defaultCollapsed?: boolean
  breakpoint?: number // px width below which sidebar should be collapsed on mobile
}

interface UseSidebarReturn {
  isCollapsed: boolean
  isMobile: boolean
  toggleCollapse: () => void
  setCollapsed: (collapsed: boolean) => void
}

export function useSidebar({
  defaultCollapsed = false,
  breakpoint = 768
}: UseSidebarOptions = {}): UseSidebarReturn {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < breakpoint
      setIsMobile(mobile)
      
      // Auto-collapse on mobile
      if (mobile && !isCollapsed) {
        setIsCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint, isCollapsed])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed)
  }, [])

  return {
    isCollapsed,
    isMobile,
    toggleCollapse,
    setCollapsed
  }
}