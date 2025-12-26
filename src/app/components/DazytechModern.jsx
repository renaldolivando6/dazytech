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
    MapPin,
    Shield
} from 'lucide-react';

// ============================================
// DATA ARRAYS - OPTIMIZED FOR INDONESIA SEO
// ============================================

const SERVICES = [
    {
        icon: LayoutDashboard,
        title: "Jasa Pembuatan Sistem ERP Custom",
        description: "Satukan operasional perusahaan dengan visibilitas real-time. Solusi ERP custom yang menyesuaikan alur bisnis unik Anda, bukan sebaliknya.",
        features: ["Dashboard Eksekutif", "Integrasi Multi-divisi", "Sistem Approval Anti-Fraud"],
    },
    {
        icon: Truck,
        title: "Sistem Manajemen Gudang (WMS)",
        description: "Cegah selisih stok dan optimalkan logistik. Pantau pergerakan barang masuk/keluar secara akurat dari penerimaan hingga pengiriman.",
        features: ["Stok Opname Digital", "Pelacakan Serial/Batch", "Manajemen Ekspedisi"],
    },
    {
        icon: Banknote,
        title: "Software Akuntansi & Keuangan",
        description: "Otomatisasi pembukuan yang sesuai PSAK. Cegah kebocoran anggaran dan manipulasi data dengan sistem approval berjenjang.",
        features: ["Laporan Laba Rugi Real-time", "Hitung Penyusutan Aset", "Faktur Pajak"],
    },
    {
        icon: Users,
        title: "Sistem HRIS & Payroll Indonesia",
        description: "Kelola karyawan tanpa pusing regulasi. Hitung gaji, lembur, BPJS, dan PPh 21 secara otomatis dan akurat.",
        features: ["Absensi Geo-tagging", "Perhitungan BPJS & PPh 21", "Slip Gaji Digital"],
    },
    {
        icon: TrendingUp,
        title: "Aplikasi CRM & Marketing (termasuk MLM)",
        description: "Dari manajemen prospek hingga jaringan referral—lacak pipeline penjualan dan otomasi pembayaran komisi dengan sistem yang transparan.",
        features: ["Lead & Pipeline Management", "Customer 360 & Kampanye", "Bonus MLM & Dashboard"],
    },
    {
        icon: Cog,
        title: "Sistem Manufaktur & Produksi",
        description: "Rencanakan, eksekusi, dan pantau operasional pabrik dengan alur material dan pelacakan kualitas yang jelas untuk memastikan standar produksi terjaga.",
        features: ["Penjadwalan Produksi", "BOM & Tracking Material", "Quality Control"],
    },
];

const WORKS = [
    {
        title: "Sistem Manajemen Gudang & Distribusi",
        category: "Sistem Logistik",
        description: "Platform logistik komprehensif dengan pelacakan inventori real-time, optimasi rute pintar, dan koordinasi pengiriman otomatis untuk operasional multi-gudang.",
        image: "/work-1.png",
        highlights: ["Pelacakan Real-time", "Optimasi Rute", "Dukungan Multi-gudang"]
    },
    {
        title: "Sistem Manajemen Perkebunan Tebu",
        category: "ERP Pertanian",
        description: "Sistem manajemen perkebunan end-to-end yang dibangun untuk Sungai Budi Group, dilengkapi perencanaan kerja harian (RKH), pelaporan kerja (LKH), GPS tracking, dan modul keuangan untuk operasional 1000+ hektar.",
        image: "/work-2.png",
        highlights: ["Perencanaan Kerja Harian", "GPS Tracking", "Integrasi Keuangan"]
    },
    {
        title: "Dashboard Performa Penjualan",
        category: "Manajemen Penjualan",
        description: "Dashboard analitik canggih yang menampilkan total order, metrik revenue, transaksi terbaru, dan indikator performa penjualan real-time untuk pengambilan keputusan berbasis data.",
        image: "/work-3.png",
        highlights: ["Analitik Revenue", "Pelacakan Order", "Metrik Performa"]
    }
];

const PROCESS = [
    {
        number: "01",
        title: "Analisis & Riset Proses Bisnis",
        description: "Kami memulai dengan memahami bagaimana bisnis Anda beroperasi — dari workflow harian hingga bagaimana sistem Anda terhubung dan berbagi data. Baik Anda sudah memiliki platform yang perlu dioptimalkan, atau membangun solusi baru dari awal, kami mengidentifikasi apa yang perlu diperbaiki, dipertahankan, dan ditransformasi untuk skalabilitas jangka panjang."
    },
    {
        number: "02",
        title: "Perencanaan Sistem",
        description: "Di fase ini, kami mengubah ide menjadi struktur. Tim kami merancang bagaimana solusi Anda akan berfungsi — dari user journey hingga alur data — memastikan selaras sempurna dengan operasional organisasi Anda. Setiap komponen direncanakan untuk skalabilitas jangka panjang, pemeliharaan mudah, dan integrasi mulus dengan tools yang sudah ada."
    },
    {
        number: "03",
        title: "Fase Pengembangan",
        description: "Di sinilah solusi Anda menjadi nyata. Kami mengembangkan setiap modul, mengujinya dalam skenario real, dan menyempurnakannya agar sesuai dengan cara kerja tim Anda. Dengan meninjau setiap milestone bersama, kami memastikan produk akhir fungsional dan intuitif."
    },
    {
        number: "04",
        title: "Peluncuran & Implementasi",
        description: "Kami mewujudkan solusi Anda melalui proses implementasi yang terstruktur dan mulus. Tim kami memastikan setiap fitur berjalan lancar dalam penggunaan real, dari setup sistem hingga onboarding staf. Setelah diluncurkan, kami tetap mendampingi — memantau performa, menyempurnakan workflow, dan memastikan keandalan jangka panjang seiring bisnis Anda berkembang."
    }
];

const FAQS = [
    {
        question: "Berapa lama waktu yang dibutuhkan untuk membangun sistem custom?",
        answer: "Mayoritas proyek memakan waktu sekitar 2–5 bulan, tergantung kompleksitas proses dan jumlah modul yang dibutuhkan. Sistem sederhana — seperti dashboard satu departemen atau aplikasi pelacakan poin — sering dapat diselesaikan hanya dalam beberapa minggu hingga satu bulan. Kami biasanya mulai dengan versi pertama (MVP) agar Anda dapat melihat hasil lebih awal, kemudian terus menyempurnakannya secara bertahap.",
    },
    {
        question: "Bisakah diintegrasikan dengan sistem yang sudah ada?",
        answer: "Ya, kami dapat mengintegrasikan dengan tools atau sistem yang sudah Anda gunakan — seperti aplikasi akuntansi, HR, atau gudang. Anda tidak perlu mengganti semuanya dari awal; kami cukup menghubungkan bagian-bagian kunci agar data tetap sinkron dan workflow berjalan lancar.",
    },
    {
        question: "Apa yang terjadi setelah sistem diserahkan?",
        answer: "Kami tetap terlibat setelah peluncuran. Kami membantu tim Anda familiar dengan sistem, melakukan penyesuaian jika ada yang perlu diperbaiki, dan memberikan update rutin agar tetap berjalan lancar seiring bisnis Anda berkembang.",
    },
    {
        question: "Bagaimana jika bisnis kami berkembang atau berubah nanti?",
        answer: "Setiap sistem yang kami bangun dirancang untuk tumbuh bersama bisnis Anda. Saat Anda ekspansi, menambah divisi baru, atau mengubah workflow, kami dapat memperluas atau menyesuaikan sistem tanpa harus membangun ulang dari nol.",
    },
    {
        question: "Berapa biayanya?",
        answer: "Tergantung pada cakupan dan kompleksitas proyek. Solusi sederhana bisa dimulai dari beberapa juta rupiah, sementara sistem enterprise lengkap dengan banyak modul tentu memerlukan investasi lebih besar. Kami menyesuaikan setiap proposal dengan tujuan dan budget Anda.",
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
// 3D MODEL
// ============================================

if (typeof window !== 'undefined') {
    useGLTF.preload("/doggy.glb");
}

const DoggyModel = memo(function DoggyModel({ url }) {
    const { scene } = useGLTF(url);
    const meshRef = useRef();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth < 1024);

        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
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

    const scale = isMobile ? 3 : 2.8;

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
// BACKGROUND
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
// SCROLL SECTION
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
// MAIN COMPONENT
// ============================================

export default function DazytechModern() {
    const [activeFaq, setActiveFaq] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % WORKS.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + WORKS.length) % WORKS.length);
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    // Loading simulation dengan progress
    useEffect(() => {
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + Math.random() * 15;
            });
        }, 200);

        // Minimum loading time 2 detik untuk brand impression
        const minLoadTime = setTimeout(() => {
            setLoadingProgress(100);
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        }, 2000);

        return () => {
            clearInterval(progressInterval);
            clearTimeout(minLoadTime);
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentSlide]);

    return (
        <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
            {/* Loading Screen */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[9999] bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center"
                    >
                        <div className="text-center">
                            {/* Logo */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="mb-8 flex justify-center"
                            >
                                <Image
                                    src="/dazytech-logo-circle.png"
                                    alt="Dazytech Loading"
                                    width={80}
                                    height={80}
                                    className="w-20 h-20"
                                />
                            </motion.div>

                            {/* Loading Text */}
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                            >
                                Dazytech Solutions
                            </motion.h2>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm text-gray-600 mb-8"
                            >
                                Memuat pengalaman digital Anda...
                            </motion.p>

                            {/* Progress Bar */}
                            <div className="w-64 mx-auto">
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${loadingProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                        className="h-full rounded-full"
                                        style={{ background: 'linear-gradient(135deg, #8B4513, #A0522D)' }}
                                    />
                                </div>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-xs text-gray-500 mt-3"
                                >
                                    {Math.round(loadingProgress)}%
                                </motion.p>
                            </div>

                            {/* Animated Dots */}
                            <motion.div
                                className="flex justify-center gap-2 mt-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scale: [1, 1.3, 1],
                                            opacity: [0.3, 1, 0.3]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.2
                                        }}
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: '#8B4513' }}
                                    />
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            {[
                                { label: 'Beranda', href: '#home' },
                                { label: 'Portofolio', href: '#works' },
                                { label: 'Layanan', href: '#services' },
                                { label: 'Proses', href: '#process' }
                            ].map((item, idx) => (
                                <motion.a
                                    key={item.label}
                                    href={item.href}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 + 0.3 }}
                                    whileHover={{ y: -2 }}
                                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors relative group"
                                >
                                    {item.label}
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
                                        Konsultasi Gratis
                                        <Sparkles className="w-3 h-3" />
                                    </span>
                                </button>
                            </motion.a>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section - COMPACT VERSION */}
            <section id="home" className="pt-32 pb-20 px-6 min-h-screen flex items-center">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

                        {/* 3D Model */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="h-[150px] lg:h-[400px] relative order-1 lg:order-2"
                        >
                            <motion.div
                                className="absolute inset-0 rounded-3xl blur-lg opacity-30"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                style={{ background: 'linear-gradient(135deg, rgba(139,69,19,0.15), rgba(160,82,45,0.15))' }}
                            />
                            <Canvas
                                camera={{ position: [0, 0, 3.5], fov: 50 }}
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
                                        enableRotate={true}
                                    />
                                </Suspense>
                            </Canvas>
                        </motion.div>

                        {/* Text Content - COMPACT & SEO OPTIMIZED */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="order-2 lg:order-1"
                        >
                            <motion.h1
                                className="text-3xl lg:text-5xl font-bold mb-4 lg:mb-6 leading-tight"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                Jasa Pembuatan Software
                                <motion.span
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="block mt-1 text-transparent bg-clip-text"
                                    style={{
                                        background: 'linear-gradient(135deg, #8B4513, #A0522D)',
                                        WebkitBackgroundClip: 'text'
                                    }}
                                >
                                    ERP & Aplikasi Bisnis Custom
                                </motion.span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="text-base lg:text-lg text-gray-600 mb-6 lg:mb-8 leading-relaxed"
                            >
                                Dazytech Solutions adalah konsultan IT dan software house berbasis di <strong>Jakarta</strong> yang fokus membangun <strong>Sistem ERP</strong>, Web App Enterprise, dan Transformasi Digital untuk perusahaan Indonesia.
                            </motion.p>



                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="flex flex-col sm:flex-row flex-wrap gap-3"
                            >
                                <motion.a
                                    href="#works"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <button className="group w-full sm:w-auto px-6 py-3 text-white text-sm font-medium rounded-full transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #8B4513, #654321)' }}>
                                        Lihat Portofolio
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
                                    <button className="w-full sm:w-auto px-6 py-3 text-sm font-medium border-2 rounded-full hover:bg-stone-50 transition-all flex items-center justify-center gap-2" style={{ borderColor: '#d2a993', color: '#8B4513' }}>
                                        <Headphones className="w-4 h-4" />
                                        Hubungi Tim Ahli
                                    </button>
                                </motion.a>
                            </motion.div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* Works Section */}
            <section id="works" className="py-24 px-6 bg-gradient-to-b from-stone-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <ScrollSection>
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-5xl font-bold mb-6 text-gray-900">Portofolio Terbaru</h2>
                            <p className="text-xl text-gray-600">
                                Solusi nyata untuk bisnis nyata. Lihat bagaimana kami membantu perusahaan mentransformasi operasional mereka.
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
                                        className={`w-3 h-3 rounded-full transition-all ${currentSlide === index
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
                                Transformasi setiap aspek bisnis Anda
                            </h2>
                            <p className="text-xl text-gray-600">
                                Kami membangun software custom yang tumbuh bersama bisnis Anda, dari operasi kecil hingga skala enterprise.
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
                                Jalur transformasi digital Anda
                            </h2>
                            <p className="text-xl text-gray-600">
                                Sederhana, transparan, dan efektif. Begini cara kami bekerja sama membangun solusi Anda.
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
                                Dibangun dengan teknologi standar industri
                            </h2>
                            <p className="text-lg text-gray-600">
                                Tech stack tingkat enterprise yang dipercaya perusahaan dunia
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
                                Siap optimalkan bisnis Anda?
                            </h2>
                            <p className="text-xl text-gray-600">
                                Mari diskusikan bagaimana software custom dapat merampingkan operasional, mengurangi biaya, dan mempercepat pertumbuhan Anda.
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
                                    <h3 className="text-3xl font-bold mb-8">Mulai transformasi Anda hari ini</h3>

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
                                                    <div className="text-sm text-gray-300">WhatsApp (Prioritas)</div>
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
                                                <div className="text-sm text-gray-400 mb-1">Lokasi Kantor</div>
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
                                            Jadwalkan Konsultasi Gratis
                                        </button>
                                    </motion.a>
                                </div>
                            </motion.div>
                        </ScrollSection>

                        {/* FAQ Side */}
                        <ScrollSection delay={0.4}>
                            <div>
                                <h3 className="text-2xl font-bold mb-8 text-gray-900">Pertanyaan yang Sering Diajukan</h3>

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
                                Software house Jakarta yang membangun sistem ERP dan aplikasi enterprise untuk transformasi digital perusahaan Indonesia.
                            </p>
                        </div>

                        <div className="lg:col-span-3">
                            <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-wider">Solusi Kami</h4>
                            <ul className="space-y-2.5">
                                {['Sistem ERP Custom', 'Software Gudang (WMS)', 'Aplikasi HRIS & Payroll', 'Software Akuntansi', 'Transformasi Digital'].map((item) => (
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
                            <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-wider">Hubungi Kami</h4>
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
                                © 2025 Dazytech Solutions. Hak cipta dilindungi.
                            </p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <a href="/kebijakan-privasi" className="text-xs text-gray-500 hover:text-amber-400 transition-colors">Kebijakan Privasi</a>
                                <span className="text-gray-700">•</span>
                                <a href="/syarat-layanan" className="text-xs text-gray-500 hover:text-amber-400 transition-colors">Syarat Layanan</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}