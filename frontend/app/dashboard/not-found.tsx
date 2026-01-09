'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      {/* Header com logo */}
      <div className="h-16 bg-white border-b-2 border-black flex items-center px-6">
        <Link href="/dashboard">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-black flex items-center justify-center">
              <span className="text-[#00ff88] font-bold text-lg">T</span>
            </div>
            <span className="text-lg font-bold text-black">Thumdra</span>
          </div>
        </Link>
      </div>

      {/* Conteúdo centralizado */}
      <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {/* Main Card */}
        <div className="bg-white border-2 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-[#00ff88] border-2 border-black flex items-center justify-center mx-auto mb-6"
          >
            <AlertCircle className="w-10 h-10 text-black" strokeWidth={2.5} />
          </motion.div>

          {/* Error Code */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-8xl font-extrabold text-black mb-4">404</h1>
            <h2 className="text-2xl font-bold text-black mb-2">
              Página não encontrada
            </h2>
            <p className="text-gray-600 font-medium">
              A página que você está procurando não existe ou ainda está em
              desenvolvimento.
            </p>
          </motion.div>

          {/* Divider */}
          <div className="border-t-2 border-gray-200 my-8"></div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <Link href="/dashboard">
              <button className="px-8 py-3 bg-black text-[#00ff88] font-bold border-2 border-black hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                <Home className="w-5 h-5" strokeWidth={2.5} />
                Voltar para o Dashboard
              </button>
            </Link>
          </motion.div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 bg-gray-50 border-l-4 border-black"
          >
            <p className="text-sm text-gray-700 font-medium">
              <span className="font-bold text-black">Dica:</span> Algumas
              funcionalidades ainda estão sendo desenvolvidas. Confira o
              roadmap para saber quando estarão disponíveis.
            </p>
          </motion.div>
        </div>

        {/* Features Coming Soon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-white border-2 border-black p-6"
        >
          <h3 className="font-bold text-black mb-4 flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-[#00ff88]"></span>
            Recursos em Desenvolvimento
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gray-50 border-l-2 border-gray-300">
              <p className="font-bold text-black">Automações</p>
              <p className="text-xs text-gray-600 mt-1">Em breve</p>
            </div>
            <div className="p-3 bg-gray-50 border-l-2 border-gray-300">
              <p className="font-bold text-black">Pipeline</p>
              <p className="text-xs text-gray-600 mt-1">Em breve</p>
            </div>
            <div className="p-3 bg-gray-50 border-l-2 border-gray-300">
              <p className="font-bold text-black">Campanhas</p>
              <p className="text-xs text-gray-600 mt-1">Em breve</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
}
