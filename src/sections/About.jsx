import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiUsers, FiBook, FiHeart, FiMapPin } from 'react-icons/fi'
import { assets } from '../assets/assets'



const About = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1
  })

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <section id="about" className="section relative overflow-hidden py-20" ref={ref}>
      {/* Diagonal/curved accent gradient, only on large screens */}
      <svg
        className="hidden lg:block absolute left-0 top-0 h-full w-1/2 z-0"
        viewBox="0 0 400 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ minHeight: '100%', maxHeight: '100vh' }}
      >
        <path
          d="M0,0 Q100,400 0,800 L400,800 L400,0 Z"
          fill="url(#about-gradient)"
        />
        <defs>
          <linearGradient id="about-gradient" x1="0" y1="0" x2="400" y2="800" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="0.5" stopColor="#10B981" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>

       {/* Vertical fade mask for the accent, only on large screens */}
       <div
        className="hidden lg:block pointer-events-none absolute left-0 top-0 h-full w-1/2 z-10"
        style={{
          background: 'linear-gradient(to bottom, #f9fafb 100px, transparent 1000px, transparent calc(100% - 800px), #f9fafb calc(100% - 64px))'
        }}
      />

      <div className="container-custom relative z-10 lg:pl-32">
        <motion.div 
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeIn}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-8 py-3 rounded-xl shadow-lg bg-emerald-500 text-white text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            About <span className="text-yellow-200">The Quran Foundation</span>
          </div>
          <p className="section-subtitle mx-auto text-lg text-slate-700 font-medium mt-4">
            A legally registered non-profit organization headquartered in Hyderabad, India, 
            dedicated to transforming the lives of marginalized communities.
          </p>
        </motion.div>
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              <img 
                src={assets.about_image} 
                alt="The Quran Foundation volunteers" 
                className="rounded-2xl shadow-2xl object-cover h-[400px] w-full border-8 border-emerald-400"
              />
              {/* Mission Statement Card */}
              <div className="absolute -bottom-8 -right-8 bg-gradient-to-br from-emerald-500 to-indigo-500 rounded-2xl shadow-2xl p-7 max-w-xs border-4 border-white">
                <h3 className="text-2xl font-extrabold text-white mb-2 drop-shadow">Our Mission</h3>
                <p className="text-white text-lg font-semibold drop-shadow">
                  "The love for creation is proof of the love for the Creator."
                </p>
              </div>
            </div>
          </motion.div>
  
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-3xl font-extrabold text-indigo-700 mb-6">Transforming Lives Since 2010</h3>
            <p className="text-gray-700 mb-6">
              With a steadfast commitment to sincerity, dedication, and consistency, 
              The Quran Foundation focuses on fostering educational, social, and cultural advancement. 
              By collaborating with other NGOs, we unite efforts to catalyze positive societal change, 
              enhance livelihoods, and nurture intellects.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
              {[
                { icon: <FiUsers size={24} />, title: 'Community Focus', description: 'Working directly with marginalized communities' },
                { icon: <FiBook size={24} />, title: 'Educational Initiatives', description: 'Prioritizing education for sustainable change' },
                { icon: <FiHeart size={24} />, title: 'Compassionate Action', description: 'Serving with love and dedication' },
                { icon: <FiMapPin size={24} />, title: 'Local Impact', description: 'Creating change in Hyderabad slum areas' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, delay: 0.6 + (index * 0.1) }}
                  className="flex items-start bg-white/80 rounded-xl shadow-lg p-4 border-l-4 border-emerald-400"
                >
                  <div className="bg-emerald-500 p-3 rounded-full text-white mr-4 flex-shrink-0 shadow">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-indigo-800 mb-1 text-lg">{item.title}</h4>
                    <p className="text-slate-700 text-base font-medium">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
  
}

export default About