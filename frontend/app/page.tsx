import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="text-center space-y-8 p-8">
        {/* Logo */}
        <div className="space-y-4">
          <h1 className="text-7xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Zyva
          </h1>
          <p className="text-2xl text-gray-600">
            CRM Inteligente para seu negócio
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-semibold text-lg mb-2">WhatsApp</h3>
            <p className="text-gray-600 text-sm">
              Automações inteligentes para WhatsApp Business
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-semibold text-lg mb-2">CRM Completo</h3>
            <p className="text-gray-600 text-sm">
              Gerencie seus contatos e vendas em um só lugar
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Automações</h3>
            <p className="text-gray-600 text-sm">
              Crie fluxos automatizados sem código
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-4 justify-center mt-12">
          <Link
            href="/login"
            className="px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition shadow-lg"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="px-8 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-50 transition shadow-lg border-2 border-purple-600"
          >
            Criar Conta Grátis
          </Link>
        </div>

        {/* Status */}
        <div className="mt-12 text-sm text-gray-500">
          ✅ Backend rodando • ✅ Autenticação funcionando • 🚀 Pronto para usar
        </div>
      </div>
    </div>
  );
}
