'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function FloatingHero() {
  return (
    <section className="relative min-h-screen bg-white grid-bg overflow-hidden">
      {/* Geometric shapes background */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-[#00ff88] opacity-10 rotate-12"></div>
      <div className="absolute bottom-40 left-20 w-96 h-96 bg-[#ff3366] opacity-5 -rotate-6"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24">
        {/* Top badge - asymmetric */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-block mb-12 -rotate-1"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-[#00ff88] brutal-border brutal-shadow-sm font-bold uppercase text-sm tracking-wider">
            <Sparkles className="w-4 h-4" strokeWidth={3} />
            CRM QUE CONVERTE
          </div>
        </motion.div>

        {/* Main headline - HUGE and asymmetric */}
        <div className="grid lg:grid-cols-12 gap-8 items-start mb-16">
          <div className="lg:col-span-8">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-7xl md:text-[clamp(4rem,12vw,10rem)] font-extrabold leading-[0.9] mb-8"
            >
              <span className="block">O CRM QUE</span>
              <span className="block relative inline-block mt-2">
                <span className="bg-[#00ff88] text-black px-4 brutal-border brutal-shadow -rotate-1 inline-block">
                  AUTOMATIZA
                </span>
              </span>
              <span className="block mt-2">TUDO</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl max-w-2xl mb-10 font-medium leading-relaxed"
            >
              Automação de WhatsApp, pipeline visual e flows inteligentes.
              <br />
              <span className="text-gray-600">Para empresas que não aceitam mediocridade.</span>
            </motion.p>

            {/* CTAs - brutal style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/cadastro">
                <motion.button
                  whileHover={{ x: 4, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-5 bg-[#00ff88] text-black brutal-border-thick brutal-shadow font-bold text-lg uppercase tracking-wide flex items-center gap-3 hover:bg-[#00ff88]/90 transition-colors"
                >
                  Começar Grátis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ x: 4, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-5 bg-white text-black brutal-border-thick brutal-shadow font-bold text-lg uppercase tracking-wide hover:bg-gray-50 transition-colors"
              >
                Ver Demo
              </motion.button>
            </motion.div>

            {/* Trust badges - raw style */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 flex flex-wrap gap-6 text-sm font-bold uppercase"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#00ff88]"></div>
                <span>14 DIAS GRÁTIS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#00ff88]"></div>
                <span>SEM CARTÃO</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#00ff88]"></div>
                <span>SUPORTE BR</span>
              </div>
            </motion.div>
          </div>

          {/* Right side - Stats cards with brutal design */}
          <div className="lg:col-span-4 space-y-6 mt-12 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black text-white p-8 brutal-border brutal-shadow-lg rotate-2"
            >
              <div className="text-sm font-bold uppercase mb-2 text-[#00ff88]">Conversão Média</div>
              <div className="text-6xl font-extrabold">+127%</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#ffeb3b] text-black p-6 brutal-border brutal-shadow -rotate-1"
            >
              <div className="text-sm font-bold uppercase mb-1">Automação</div>
              <div className="text-4xl font-extrabold">98.7%</div>
            </motion.div>

           
          </div>
        </div>

        {/* Bottom stats - full width, asymmetric */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
        >
          {[
            { label: 'EMPRESAS ATIVAS', value: '200+' },
            { label: 'MENSAGENS/DIA', value: '50K+' },
            { label: 'AUTOMAÇÕES CRIADAS', value: '1.2K+' },
            { label: 'SATISFAÇÃO', value: '4.9★' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-6 bg-white brutal-border brutal-shadow-sm ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
            >
              <div className="text-3xl font-extrabold mb-1">{stat.value}</div>
              <div className="text-xs font-bold uppercase text-gray-600">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator - brutal version */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 rotate-2"
      >
        <div className="px-4 py-2 bg-white brutal-border brutal-shadow-sm font-bold text-xs uppercase">
          SCROLL ↓
        </div>
      </motion.div>
    </section>
  );
}
