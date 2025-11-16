'use client';

import React, { useState, useEffect, useRef, Suspense, memo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  ArrowRight, 
  Headphones, 
  Sparkles, 
  LayoutDashboard,
  Truck,
  Banknote,
  TrendingUp,
  Cog,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

// ============================================
// DATA ARRAYS (OUTSIDE COMPONENT) - OPTIMIZED
// ============================================

const SERVICES = [
  {
    icon: LayoutDashboard,
    title: "Enterprise Resource Planning",
    description: "Unified operations with real-time visibility. Streamline finance, inventory, HR, and daily processes in one platform.",
    features: ["Real-time Dashboards", "Multi-division Support", "Approval Workflows"],
  },
  {
    icon: Truck,
    title: "Warehouse & Logistics",
    description: "Optimize inventory movement from inbound to last-mile. Track, plan, and measure logistics performance end-to-end.",
    features: ["Inventory Tracking", "Smart Routing", "Fleet & Delivery"],
  },
  {
    icon: Banknote,
    title: "Finance & Accounting Automation",
    description: "Cut repetitive tasks and accelerate month-end closing with accurate, auditable financial flows.",
    features: ["Automated Reconciliation", "Approval Policies", "Real-time Reporting"],
  },
  {
    icon: Users,
    title: "HR & Payroll System",
    description: "Manage people operations from attendance to payroll in one centralized, compliant system.",
    features: ["Attendance & Leave", "Performance Review", "Payroll & Tax"],
  },
  {
    icon: TrendingUp,
    title: "Sales, CRM & Marketing (incl. MLM)",
    description: "From lead management to referral networks—track pipelines and automate commission payouts.",
    features: ["Lead & Pipeline", "Customer 360 & Campaigns", "MLM Bonuses & Dashboard"],
  },
  {
    icon: Cog,
    title: "Manufacturing & Production",
    description: "Plan, execute, and monitor shop-floor operations with clear material flow and quality tracking.",
    features: ["Production Scheduling", "BOM & Material Tracking", "Quality Control"],
  },
];

const WORKS = [
  {
    title: "Warehouse & Distribution Management",
    category: "Logistics System",
    description: "Comprehensive logistics platform with real-time inventory tracking, smart route optimization, and automated delivery coordination for multi-warehouse operations.",
    image: "/work-1.png",
    highlights: ["Real-time Tracking", "Route Optimization", "Multi-warehouse Support"]
  },
  {
    title: "Sugarcane Management System",
    category: "Agricultural ERP",
    description: "End-to-end plantation management system built for Sungai Budi Group, featuring daily work planning (RKH), work reporting (LKH), GPS tracking, and financial modules for 1000+ hectares operations.",
    image: "/work-2.png",
    highlights: ["Daily Work Planning", "GPS Tracking", "Financial Integration"]
  },
  {
    title: "Sales Performance Dashboard",
    category: "Sales Management",
    description: "Advanced analytics dashboard displaying total orders, revenue metrics, latest transactions, and real-time sales performance indicators for data-driven decision making.",
    image: "/work-3.png",
    highlights: ["Revenue Analytics", "Order Tracking", "Performance Metrics"]
  }
];

const PROCESS = [
  {
    number: "01",
    title: "Business Process Discovery & Analysis",
    description: "We begin by understanding how your business operates — from day-to-day workflows to how your systems connect and share data. Whether you already have an existing platform that needs optimization, or you're building a brand-new solution from scratch, we identify what to improve, what to keep, and what to transform for long-term scalability."
  },
  {
    number: "02",
    title: "System Planning",
    description: "In this phase, we turn ideas into structure. Our team designs how your solution will function — from user journeys to data flow — ensuring it aligns perfectly with your organization's operations. Every component is planned for long-term scalability, easy maintenance, and seamless integration with your existing tools."
  },
  {
    number: "03",
    title: "Build Phase",
    description: "This is where your solution comes to life. We develop each module, test it in real scenarios, and refine it to match how your team actually works. By reviewing each milestone together, we ensure the final product is both functional and intuitive."
  },
  {
    number: "04",
    title: "Launch & Implementation",
    description: "We bring your solution to life through a structured and seamless implementation process. Our team ensures every feature runs smoothly in real-world use, from system setup to staff onboarding. Once launched, we stay by your side — monitoring performance, refining workflows, and ensuring long-term reliability as your business scales."
  }
];

const FAQS = [
  {
    question: "How long does it take to build a custom system?",
    answer: "Most projects take around 2–5 months, depending on how complex your processes are and how many modules are included. Simpler systems — like a single-department dashboard or point tracking app — can often be completed within just a few weeks to one month. We usually start with a first version (MVP) so you can see results early, then keep improving it step by step.",
  },
  {
    question: "Can you connect it with our existing systems?",
    answer: "Yes, we can integrate with the tools or systems you already use — such as accounting, HR, or warehouse apps. You don't have to replace everything from scratch; we simply connect key parts so data stays in sync and workflows remain smooth.",
  },
  {
    question: "What happens after the system is delivered?",
    answer: "We stay involved after launch. We help your team get familiar with the system, make adjustments if something needs improvement, and provide regular updates to keep it running smoothly as your business evolves.",
  },
  {
    question: "What if our business grows or changes later?",
    answer: "Every system we build is designed to grow with your business. When you expand, add new divisions, or change workflows, we can extend or adjust the system without rebuilding everything from zero.",
  },
  {
    question: "How much does it cost?",
    answer: "It depends on the scope and complexity of the project. Simpler solutions may start from a few millions rupiah, while full enterprise systems with multiple modules naturally require a larger investment. We tailor each proposal to fit your goals and budget.",
  },
];

const TECH_STACK = [
  { name: 'Laravel', icon: 'https://cdn.simpleicons.org/laravel/FF2D20' },
  { name: 'Node.js', icon: 'https://cdn.simpleicons.org/nodedotjs/339933' },
  { name: 'React', icon: 'https://cdn.simpleicons.org/react/61DAFB' },
  { name: 'Next.js', icon: 'https://cdn.simpleicons.org/nextdotjs/000000' },
  { name: 'Vue.js', icon: 'https://cdn.simpleicons.org/vuedotjs/4FC08D' },
  { name: 'TypeScript', icon: 'https://cdn.simpleicons.org/typescript/3178C6' },
  { name: 'MySQL', icon: 'https://cdn.simpleicons.org/mysql/4479A1' },
  { name: 'MariaDB', icon: 'https://cdn.simpleicons.org/mariadb/003545' },
];

// ============================================
// 3D MODEL - OPTIMIZED WITH MEMO & PRELOAD
// ============================================

if (typeof window !== 'undefined') {
  useGLTF.preload("/doggy.glb");
}

const DoggyModel = memo(function DoggyModel({ url }) {
  const { scene } = useGLTF(url);
  const meshRef = useRef();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        
        if (child.material) {
          if (child.material.color) {
            child.material.color.multiplyScalar(1.3);
          }
          child.material.metalness = 0.2;
          child.material.roughness = 0.5;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  const scale = isMobile ? 2.5 : 4;

  return (
    <primitive 
      ref={meshRef}
      object={scene} 
      scale={[scale, scale, scale]}
      position={[0, 0, 0]}
    />
  );
});

// ============================================
// BACKGROUND - SUBTLE ANIMATED
// ============================================

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-amber-50/30 via-white to-stone-50/30">
      <motion.div 
        animate={{ 
          x: [0, 50, 0],
          y: [0, -50, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-transparent rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ 
          x: [0, -50, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-stone-300/20 to-transparent rounded-full blur-3xl"
      />
    </div>
  );
}

// ============================================
// SCROLL SECTION - ENHANCED ANIMATION
// ============================================

function ScrollSection({ children, className = "", delay = 0 }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <motion.div
      className={className}
      initial={mounted ? { opacity: 0, y: 60, scale: 0.95 } : false}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ 
        duration: 0.7, 
        ease: [0.25, 0.1, 0.25, 1],
        delay 
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// FLOATING CARD - ENHANCED
// ============================================

function FloatingCard({ children, delay = 0 }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>{children}</div>;
  }
  
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-8, 8, -8] }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DazytechModern() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % WORKS.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + WORKS.length) % WORKS.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Auto slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <AnimatedBackground />
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-stone-200"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <Image src="/dazytech-logo-circle.png" alt="Dazytech" width={36} height={36} className="h-9 w-auto" />
              <div className="flex flex-col -ml-0.5">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent leading-none">
                  dazytech
                </span>
                <span className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase -mt-0.5">
                  SOLUTIONS
                </span>
              </div>
            </motion.div>
            <div className="hidden md:flex gap-8 items-center">
              {['Home', 'Works', 'Services', 'Process'].map((item, idx) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 + 0.3 }}
                  whileHover={{ y: -2 }}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors relative group"
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-600 to-amber-800 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </motion.a>
              ))}
              <motion.a 
                href="#contact"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button className="px-6 py-2.5 text-white text-sm font-medium rounded-full transition-all shadow-md hover:shadow-xl relative overflow-hidden group" style={{ background: 'linear-gradient(135deg, #8B4513, #654321)' }}>
                  <span className="relative z-10 flex items-center gap-2">
                    Start Your Project
                    <Sparkles className="w-3 h-3" />
                  </span>
                </button>
              </motion.a>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-6 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.h1 
                className="text-5xl lg:text-7xl font-bold mb-8 leading-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Custom software
                <motion.span 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="block mt-2 text-transparent bg-clip-text"
                  style={{ 
                    background: 'linear-gradient(135deg, #8B4513, #A0522D)',
                    WebkitBackgroundClip: 'text'
                  }}
                >
                  for your business
                </motion.span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-gray-600 mb-10 leading-relaxed"
              >
                We build Enterprise Web Applications and ERP Systems that streamline operations, 
                automate manual processes, and solve your unique business challenges.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap gap-4"
              >
                <motion.a 
                  href="#works"
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(139,69,19,0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button className="group px-8 py-4 text-white text-sm font-medium rounded-full transition-all shadow-lg hover:shadow-xl flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #8B4513, #654321)' }}>
                    See Latest Works
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.a>
                <motion.a 
                  href="https://wa.me/6285171571591"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button className="px-8 py-4 text-sm font-medium border-2 rounded-full hover:bg-stone-50 transition-all flex items-center gap-2" style={{ borderColor: '#d2a993', color: '#8B4513' }}>
                    <Headphones className="w-4 h-4" />
                    Free Consultation
                  </button>
                </motion.a>
              </motion.div>
            </motion.div>

            {/* 3D Model */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-[500px] relative canvas-container"
            >
              <style jsx>{`
                @media (max-width: 1023px) {
                  .canvas-container canvas {
                    pointer-events: none !important;
                  }
                }
                @media (min-width: 1024px) {
                  .canvas-container canvas {
                    pointer-events: auto !important;
                  }
                }
              `}</style>
              <motion.div 
                className="absolute inset-0 rounded-3xl blur-lg opacity-30"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ background: 'linear-gradient(135deg, rgba(139,69,19,0.15), rgba(160,82,45,0.15))' }}
              />
              <Canvas 
                camera={{ position: [0, 0, 5], fov: 50 }}
                dpr={[1, 2]}
                gl={{
                  antialias: true,
                  alpha: true,
                  powerPreference: "high-performance",
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: 1
                }}
              >
                <ambientLight intensity={1.2} />
                <directionalLight position={[10, 10, 5]} intensity={1} castShadow={false} />
                <directionalLight position={[-10, -10, -5]} intensity={0.5} castShadow={false} />
                <pointLight position={[0, 10, 0]} intensity={0.6} castShadow={false} />
                
                <Suspense fallback={null}>
                  <DoggyModel url="/doggy.glb" />
                  <OrbitControls 
                    enableZoom={false} 
                    enablePan={false}
                    enableDamping
                    dampingFactor={0.05}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 1.5}
                    autoRotate={false}
                    enableRotate={typeof window !== 'undefined' && window.innerWidth >= 1024}
                  />
                </Suspense>
              </Canvas>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Works Section - Modern Slider */}
      <section id="works" className="py-24 px-6 bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-7xl mx-auto">
          <ScrollSection>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-5xl font-bold mb-6 text-gray-900">Latest Works</h2>
              <p className="text-xl text-gray-600">
                Real solutions for real businesses. See how we&apos;ve helped companies transform their operations.
              </p>
            </div>
          </ScrollSection>

          {/* Slider Container */}
          <div className="relative max-w-6xl mx-auto">
            {/* Navigation Buttons */}
            <motion.button
              onClick={prevSlide}
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.9 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 z-20 w-12 h-12 rounded-full bg-white shadow-xl border-2 flex items-center justify-center hover:bg-stone-50 transition-all"
              style={{ borderColor: '#e8d5c7' }}
            >
              <ChevronLeft className="w-6 h-6" style={{ color: '#8B4513' }} />
            </motion.button>

            <motion.button
              onClick={nextSlide}
              whileHover={{ scale: 1.1, x: 5 }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 z-20 w-12 h-12 rounded-full bg-white shadow-xl border-2 flex items-center justify-center hover:bg-stone-50 transition-all"
              style={{ borderColor: '#e8d5c7' }}
            >
              <ChevronRight className="w-6 h-6" style={{ color: '#8B4513' }} />
            </motion.button>

            {/* Main Slider */}
            <div className="relative overflow-hidden rounded-3xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-3xl p-8 lg:p-12 border-2 shadow-2xl"
                  style={{ borderColor: '#e8d5c7' }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Image Side */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="relative group order-2 lg:order-1"
                    >
                      <div className="rounded-2xl overflow-hidden shadow-xl border-2 relative bg-stone-100" style={{ borderColor: '#e8d5c7' }}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.4 }}
                          className="relative w-full"
                          style={{ paddingBottom: '80%' }}
                        >
                          <Image 
                            src={WORKS[currentSlide].image} 
                            alt={WORKS[currentSlide].title}
                            fill
                            className="object-contain p-2"
                            priority={currentSlide === 0}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </motion.div>
                      </div>
                    </motion.div>
                    
                    {/* Content Side */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="order-1 lg:order-2"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ 
                        background: 'linear-gradient(135deg, rgba(139,69,19,0.1), rgba(139,69,19,0.15))',
                        color: '#8B4513'
                      }}>
                        <Sparkles className="w-3 h-3" />
                        {WORKS[currentSlide].category}
                      </div>
                      
                      <h3 className="text-3xl lg:text-4xl font-bold mb-6 text-gray-900">
                        {WORKS[currentSlide].title}
                      </h3>
                      
                      <p className="text-gray-600 text-lg leading-relaxed mb-8">
                        {WORKS[currentSlide].description}
                      </p>
                      
                      {/* Highlights */}
                      <div className="space-y-3">
                        {WORKS[currentSlide].highlights.map((highlight, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + idx * 0.1 }}
                            className="flex items-center gap-3"
                          >
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#8B4513' }} />
                            <span className="text-gray-700 font-medium">{highlight}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-3 mt-8">
              {WORKS.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToSlide(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <div 
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentSlide === index 
                        ? 'w-8' 
                        : 'w-3'
                    }`}
                    style={{ 
                      background: currentSlide === index 
                        ? 'linear-gradient(135deg, #8B4513, #A0522D)' 
                        : '#d2a993'
                    }}
                  />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollSection>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-5xl font-bold mb-6 text-gray-900">
                Transform every aspect of your business
              </h2>
              <p className="text-xl text-gray-600">
                We build custom software that grows with your business, from small operations to enterprise scale.
              </p>
            </div>
          </ScrollSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <ScrollSection key={index} delay={index * 0.08}>
                  <motion.div
                    whileHover={{ 
                      y: -12, 
                      scale: 1.02,
                      boxShadow: "0 25px 50px -12px rgba(139,69,19,0.25)"
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="group relative bg-white rounded-2xl p-8 border-2 transition-all h-full hover:shadow-xl overflow-hidden"
                    style={{ borderColor: '#e8d5c7' }}
                  >
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, rgba(210,169,147,0.05), rgba(139,69,19,0.05))' }}
                    />
                    
                    <div className="relative">
                      <motion.div 
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 p-4 rounded-2xl w-fit"
                        style={{ background: 'linear-gradient(135deg, rgba(139,69,19,0.1), rgba(139,69,19,0.15))' }}
                      >
                        <IconComponent className="w-6 h-6" style={{ color: '#8B4513' }} />
                      </motion.div>
                      
                      <h3 className="text-xl font-bold mb-4 text-gray-900">{service.title}</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                      
                      <div className="space-y-3">
                        {service.features.map((feature, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-3 text-sm text-gray-600"
                          >
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#8B4513' }} />
                            <span>{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </ScrollSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-24 px-6 bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-6xl mx-auto">
          <ScrollSection>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-5xl font-bold mb-6 text-gray-900">
                Your path to digital transformation
              </h2>
              <p className="text-xl text-gray-600">
                Simple, transparent, and effective. Here&apos;s how we work together to build your solution.
              </p>
            </div>
          </ScrollSection>

          <div className="relative">
            <motion.div 
              className="absolute left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 hidden lg:block"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ originY: 0 }}
            />
            
            <div className="space-y-16">
              {PROCESS.map((step, index) => (
                <ScrollSection key={index} delay={index * 0.15}>
                  <motion.div 
                    whileHover={{ x: 15 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex gap-8 items-start relative"
                  >
                    <div className="flex-shrink-0 relative">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ 
                          type: "spring",
                          stiffness: 200,
                          delay: index * 0.15 
                        }}
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 bg-white shadow-lg relative z-10" 
                        style={{ 
                          borderColor: '#8B4513',
                          color: '#8B4513'
                        }}
                      >
                        {step.number}
                      </motion.div>
                      <motion.div
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 rounded-2xl -z-10"
                        style={{ background: 'radial-gradient(circle, rgba(139,69,19,0.3), transparent)' }}
                      />
                    </div>
                    
                    <motion.div 
                      className="flex-1 bg-white rounded-2xl p-8 shadow-lg border" 
                      style={{ borderColor: '#e8d5c7' }}
                      whileHover={{ boxShadow: "0 20px 40px -12px rgba(139,69,19,0.2)" }}
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    </motion.div>
                  </motion.div>
                </ScrollSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-7xl mx-auto">
          <ScrollSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">
                Built with industry-standard technologies
              </h2>
              <p className="text-lg text-gray-600">
                Enterprise-grade tech stack trusted by worldwide companies
              </p>
            </div>
          </ScrollSection>

          <ScrollSection delay={0.2}>
            <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-16">
              {TECH_STACK.map((tech, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.1,
                    filter: "grayscale(0%)"
                  }}
                  className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <img 
                      src={tech.icon} 
                      alt={tech.name} 
                      className="w-12 h-12" 
                      loading="lazy"
                    />
                  </motion.div>
                  <span className="text-sm font-semibold text-gray-700">{tech.name}</span>
                </motion.div>
              ))}
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Contact & FAQ Section */}
      <section id="contact" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollSection>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-5xl font-bold mb-6 text-gray-900">
                Ready to optimize your business?
              </h2>
              <p className="text-xl text-gray-600">
                Let&apos;s discuss how custom software can streamline your operations, reduce costs, and accelerate your growth.
              </p>
            </div>
          </ScrollSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form Side */}
            <ScrollSection delay={0.2}>
              <motion.div 
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 text-white relative overflow-hidden"
                whileHover={{ boxShadow: "0 30px 60px -12px rgba(139,69,19,0.4)" }}
              >
                <motion.div 
                  className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -20, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.3, 1], x: [0, -20, 0], y: [0, 20, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-8">Start your transformation today</h3>
                  
                  <div className="space-y-6 mb-10">
                    <motion.a 
                      href="https://wa.me/6285171571591"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ x: 8, scale: 1.02 }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur hover:bg-white/20 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Phone className="w-5 h-5 text-white" />
                        </motion.div>
                        <div>
                          <div className="text-sm text-gray-300">WhatsApp (Preferred)</div>
                          <div className="font-semibold">+62 851 7157 1591</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </motion.a>

                    <motion.a 
                      href="mailto:dazytechsolutions@gmail.com"
                      whileHover={{ x: 8, scale: 1.02 }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur hover:bg-white/20 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Mail className="w-5 h-5 text-white" />
                        </motion.div>
                        <div>
                          <div className="text-sm text-gray-300">Email</div>
                          <div className="font-semibold break-all">dazytechsolutions@gmail.com</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </motion.a>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Office Location</div>
                        <div className="font-semibold">
                          Jl. Permata, Kalideres<br />
                          Jakarta Barat 11820
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.a
                    href="https://wa.me/6285171571591"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button className="w-full py-4 rounded-2xl font-semibold text-gray-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 transition-all shadow-xl">
                      Schedule Free Consultation Call
                    </button>
                  </motion.a>
                </div>
              </motion.div>
            </ScrollSection>

            {/* FAQ Side */}
            <ScrollSection delay={0.4}>
              <div>
                <h3 className="text-2xl font-bold mb-8 text-gray-900">Frequently Asked Questions</h3>
                
                <div className="space-y-4">
                  {FAQS.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <motion.button
                        onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                        whileHover={{ scale: 1.02 }}
                        className="w-full text-left p-6 rounded-2xl border-2 transition-all hover:shadow-lg bg-white group"
                        style={{ borderColor: activeFaq === index ? '#8B4513' : '#e8d5c7' }}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 pr-4">{faq.question}</h4>
                          <motion.div
                            animate={{ rotate: activeFaq === index ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: '#8B4513' }} />
                          </motion.div>
                        </div>
                        
                        <AnimatePresence>
                          {activeFaq === index && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <p className="text-gray-600 mt-4 leading-relaxed">
                                {faq.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-900 text-gray-300 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <motion.div 
            className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500 rounded-full blur-3xl"
            animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600 rounded-full blur-3xl"
            animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-gray-800">
            <div className="lg:col-span-5">
              <motion.div 
                className="flex items-center gap-2 mb-4"
                whileHover={{ scale: 1.05 }}
              >
                <Image src="/dazytech-logo-white-circle.png" alt="Dazytech" width={36} height={36} className="h-9 w-auto" />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white leading-none">dazytech</span>
                  <span className="text-[8px] font-bold tracking-[0.2em] text-gray-500 uppercase">SOLUTIONS</span>
                </div>
              </motion.div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm">
                Building enterprise software that transforms businesses and delivers measurable ROI through innovative technology solutions.
              </p>
            </div>

            <div className="lg:col-span-3">
              <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-wider">Solutions</h4>
              <ul className="space-y-2.5">
                {['ERP Systems', 'Supply Chain', 'Financial Automation', 'System Integration', 'Digital Transformation'].map((item) => (
                  <li key={item}>
                    <motion.a 
                      href="#services" 
                      className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      {item}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-4">
              <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-wider">Contact Us</h4>
              <ul className="space-y-3.5">
                <li>
                  <motion.a 
                    href="https://wa.me/6285171571591" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-sm text-gray-400 hover:text-amber-400 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <Phone className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>+62 851 7157 1591</span>
                  </motion.a>
                </li>
                <li>
                  <motion.a 
                    href="mailto:dazytechsolutions@gmail.com"
                    className="flex items-start gap-3 text-sm text-gray-400 hover:text-amber-400 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="break-words">dazytechsolutions@gmail.com</span>
                  </motion.a>
                </li>
                <li>
                  <div className="flex items-start gap-3 text-sm text-gray-400">
                    <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      Jl. Permata, Kalideres<br />
                      Jakarta Barat 11820
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-gray-500 text-center md:text-left">
                © 2025 Dazytech Solutions. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <a href="/privacy-policy" className="text-xs text-gray-500 hover:text-amber-400 transition-colors">Privacy Policy</a>
                <span className="text-gray-700">•</span>
                <a href="/terms-of-service" className="text-xs text-gray-500 hover:text-amber-400 transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}