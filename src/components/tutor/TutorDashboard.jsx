import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiGrid, FiUsers, FiLogOut, FiMenu, FiX, FiChevronLeft } from 'react-icons/fi'
import TutorSidebar from './TutorSidebar'
import TutorOverview from './TutorOverview'
import TutorStudents from './TutorStudents'

const TutorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TutorOverview />
      case 'students':
        return <TutorStudents />
      default:
        return <TutorOverview />
    }
  }

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: <FiGrid /> },
    { id: 'students', label: 'Students', icon: <FiUsers /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Mobile Header with Menu Button */}
      <header className="md:hidden bg-white shadow-md py-3 px-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">MTC Tutor Dashboard</h1>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </header>
      
      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar */}
        <TutorSidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab)
            if (isMobile) setIsSidebarOpen(false)
          }} 
          tabs={tabs}
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        {/* Main Content with animation */}
        <AnimatePresence mode="wait">
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`flex-1 p-4 md:p-6 ${isMobile ? 'mt-16' : ''}`}
          >
            {/* Mobile back button when sidebar is closed */}
            {isMobile && !isSidebarOpen && (
              <button 
                onClick={toggleSidebar}
                className="mb-4 inline-flex items-center text-primary-600 hover:text-primary-800 transition-colors"
              >
                <FiChevronLeft className="mr-1" />
                <span>Menu</span>
              </button>
            )}
            
            {renderContent()}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TutorDashboard