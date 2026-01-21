import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';

interface Status {
  status: string;
  phoneNumber: string | null;
  whatsappJid: string | null;
  lastConnected: string | null;
  usage: {
    dailyCharsUsed: number;
    dailyCharsLimit: number;
    remaining: number;
  };
}

const statusLabels: Record<string, string> = {
  connected: 'Conectado',
  disconnected: 'Desconectado',
  qr_ready: 'Aguardando QR',
  pending: 'Pendente',
  initializing: 'Inicializando',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = async () => {
    const { data } = await api.users.getStatus();
    if (data) {
      setStatus(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = async () => {
    setActionLoading(true);
    await api.users.disconnect();
    await fetchStatus();
    setActionLoading(false);
  };

  const handleLogoutWhatsApp = async () => {
    setActionLoading(true);
    await api.users.logout();
    await fetchStatus();
    setActionLoading(false);
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'qr_ready':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const usagePercent = status
    ? Math.round((status.usage.dailyCharsUsed / status.usage.dailyCharsLimit) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">VoiceReply</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user?.email}</span>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Carregando...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Connection Status Card */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">
                Conexão WhatsApp
              </h2>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(status?.status || 'pending')}`}
                />
                <span className="text-white">
                  {statusLabels[status?.status || 'pending'] || 'Não conectado'}
                </span>
              </div>

              {status?.phoneNumber && (
                <p className="text-gray-400 mb-4">
                  Telefone: {status.phoneNumber}
                </p>
              )}

              <div className="space-y-2">
                {status?.status !== 'connected' && (
                  <Link
                    to="/connect"
                    className="block w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-center font-medium rounded-lg transition-colors"
                  >
                    Conectar WhatsApp
                  </Link>
                )}

                {status?.status === 'connected' && (
                  <>
                    <button
                      onClick={handleDisconnect}
                      disabled={actionLoading}
                      className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                    >
                      Desconectar
                    </button>
                    <button
                      onClick={handleLogoutWhatsApp}
                      disabled={actionLoading}
                      className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                    >
                      Sair do WhatsApp
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Usage Card */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">
                Uso Diário
              </h2>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Caracteres usados</span>
                  <span className="text-white">
                    {status?.usage.dailyCharsUsed.toLocaleString('pt-BR')} /{' '}
                    {status?.usage.dailyCharsLimit.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      usagePercent > 80 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              </div>

              <p className="text-gray-400 text-sm">
                {status?.usage.remaining.toLocaleString('pt-BR')} caracteres restantes hoje
              </p>
            </div>

            {/* How to Use Card */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">
                Como Usar
              </h2>

              <ol className="space-y-3 text-gray-400 text-sm">
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">1.</span>
                  Responda qualquer mensagem no WhatsApp
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">2.</span>
                  Digite uma instrução como "fale como um vilão"
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 font-bold">3.</span>
                  Receba uma mensagem de voz nesse estilo
                </li>
              </ol>

              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <p className="text-gray-300 text-sm font-mono">
                  "boteco ajuda" - Ver todos os estilos disponíveis
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
