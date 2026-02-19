import React from 'react';
import { motion } from 'framer-motion';
import { 
  Map, 
  Layers, 
  BookOpen, 
  Mountain, 
  Waves, 
  Landmark, 
  Sparkles,
  Github,
  ArrowRight,
  MapPin,
  GraduationCap,
  Database,
  Eye
} from 'lucide-react';

const LandingPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mountain className="w-8 h-8 text-emerald-400" />
              <span className="text-xl font-bold tracking-tight">Montana Educational Map</span>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/ohjoncurrie-netizen/mtdashboard" 
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a href="index.html">
                <button className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105">
                  Launch Map
                </button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-slate-950 to-cyan-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(6,182,212,0.1),transparent_50%)]" />
        
        <motion.div 
          className="relative max-w-6xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">Open Source Educational Platform</span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-slate-50 via-emerald-200 to-cyan-200 bg-clip-text text-transparent leading-tight"
          >
            Explore Montana's
            <br />
            Rich History
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            An interactive educational platform featuring layered geographic data, 
            historical trails, and natural wonders. Built for students, educators, and explorers.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a href="index.html">
              <button className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105 flex items-center gap-2">
                Start Exploring
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </a>
            <button className="px-8 py-4 bg-slate-800/50 border border-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all duration-300 backdrop-blur-sm">
              View Documentation
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof Strip */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-y border-slate-800/50 bg-slate-900/30 backdrop-blur-sm"
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <div className="text-3xl font-bold text-slate-50">9+</div>
              </div>
              <div className="text-sm text-slate-400">Interactive Layers</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <div className="text-3xl font-bold text-slate-50">100+</div>
              </div>
              <div className="text-sm text-slate-400">Historic Locations</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <div className="text-3xl font-bold text-slate-50">Open</div>
              </div>
              <div className="text-sm text-slate-400">Data Sources</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <div className="text-3xl font-bold text-slate-50">100%</div>
              </div>
              <div className="text-sm text-slate-400">Free for Educators</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Feature Grid - Bento Box */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={itemVariants}
              className="text-5xl md:text-6xl font-bold tracking-tight mb-4"
            >
              Everything You Need
            </motion.h2>
            <motion.p 
              variants={itemVariants}
              className="text-xl text-slate-400 max-w-2xl mx-auto"
            >
              A comprehensive platform designed for modern education
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Interactive Layers - Large Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="md:col-span-2 md:row-span-2 p-8 bg-gradient-to-br from-slate-900 to-slate-800/50 border border-slate-700/50 rounded-2xl backdrop-blur-sm hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                  <Layers className="w-8 h-8 text-emerald-400" />
                </div>
                <span className="text-xs px-3 py-1 bg-slate-800 rounded-full text-slate-400 border border-slate-700">New</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 tracking-tight">Interactive Layers</h3>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Toggle between watersheds, grizzly bear ranges, mountain peaks, and more. 
                Each layer comes with contextual facts and educational content.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <Waves className="w-6 h-6 text-cyan-400 mb-2" />
                  <div className="text-sm font-semibold">Watersheds</div>
                  <div className="text-xs text-slate-500 mt-1">3 River Basins</div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <Mountain className="w-6 h-6 text-slate-400 mb-2" />
                  <div className="text-sm font-semibold">Mountain Peaks</div>
                  <div className="text-xs text-slate-500 mt-1">5+ Major Summits</div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <Map className="w-6 h-6 text-emerald-400 mb-2" />
                  <div className="text-sm font-semibold">Wildlife Ranges</div>
                  <div className="text-xs text-slate-500 mt-1">Protected Areas</div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <Landmark className="w-6 h-6 text-amber-400 mb-2" />
                  <div className="text-sm font-semibold">Historic Sites</div>
                  <div className="text-xs text-slate-500 mt-1">Ghost Towns & More</div>
                </div>
              </div>
            </motion.div>

            {/* Historical Data */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="p-8 bg-gradient-to-br from-cyan-950/30 to-slate-900 border border-slate-700/50 rounded-2xl backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 group"
            >
              <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 inline-block mb-6 group-hover:bg-cyan-500/20 transition-colors">
                <BookOpen className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Historical Data</h3>
              <p className="text-slate-400 leading-relaxed">
                Explore the Lewis & Clark Trail, Native American ancestral lands, and Montana's gold rush heritage.
              </p>
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="text-sm text-slate-500">Including</div>
                <div className="text-lg font-semibold text-cyan-400 mt-1">1805-1806 Expedition Routes</div>
              </div>
            </motion.div>

            {/* Classroom Ready */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="p-8 bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-slate-700/50 rounded-2xl backdrop-blur-sm hover:border-emerald-500/50 transition-all duration-300 group"
            >
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 inline-block mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <GraduationCap className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Classroom Ready</h3>
              <p className="text-slate-400 leading-relaxed">
                Designed for educators with contextual learning, interactive HUD facts, and curriculum-aligned content.
              </p>
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="text-sm text-slate-500">Perfect for</div>
                <div className="text-lg font-semibold text-emerald-400 mt-1">Grades 4-12</div>
              </div>
            </motion.div>

            {/* Open Source */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="md:col-span-3 p-8 bg-gradient-to-r from-slate-900 via-slate-800/50 to-slate-900 border border-slate-700/50 rounded-2xl backdrop-blur-sm hover:border-slate-600 transition-all duration-300 group"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Github className="w-8 h-8 text-slate-400" />
                    <h3 className="text-2xl font-bold tracking-tight">Open Source & Free Forever</h3>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Built with modern web technologies and open data sources. Fork it, contribute to it, or use it in your classroom at no cost.
                  </p>
                </div>
                <a href="https://github.com/ohjoncurrie-netizen/mtdashboard" target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-xl font-semibold hover:bg-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap">
                    View on GitHub
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center p-12 bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 border border-emerald-500/20 rounded-3xl backdrop-blur-sm"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Ready to Explore Montana?
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Start discovering Montana's natural wonders, rich history, and educational resources today.
          </p>
          <a href="index.html">
            <button className="group px-10 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto">
              Launch Interactive Map
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Mountain className="w-8 h-8 text-emerald-400" />
                <span className="text-xl font-bold">Montana Educational Map</span>
              </div>
              <p className="text-slate-400 max-w-md leading-relaxed">
                An open-source platform for exploring Montana's geography, history, and natural resources through interactive layers and educational content.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Educational Guide</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contributing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="https://github.com/ohjoncurrie-netizen/mtdashboard" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Report Issues</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Discussions</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2026 Montana Educational Map. Open source under MIT License.
            </p>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full">
              <Mountain className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-400">Built in Montana</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
