import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Connect() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('loading');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchQRCode = useCallback(async () => {
    const { data, error } = await api.users.getQRCode();

    if (error) {
      setError(error);
      setStatus('error');
      return;
    }

    if (data) {
      if (data.status === 'connected') {
        navigate('/dashboard');
        return;
      }

      if (data.qrCode) {
        setQrCode(data.qrCode);
        setStatus('qr_ready');
      } else {
        setStatus(data.status);
      }
    }
  }, [navigate]);

  const checkStatus = useCallback(async () => {
    const { data } = await api.users.getStatus();
    if (data?.status === 'connected') {
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    fetchQRCode();
  }, [fetchQRCode]);

  useEffect(() => {
    if (status === 'qr_ready') {
      const interval = setInterval(checkStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [status, checkStatus]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">BotEco</h1>
          <Link
            to="/dashboard"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Voltar ao Painel
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            Conectar WhatsApp
          </h2>
          <p className="text-gray-400 mb-8">
            Escaneie o QR code com seu WhatsApp
          </p>

          {status === 'loading' && (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <div className="text-gray-400">Gerando QR code...</div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <div className="text-red-500 mb-4">{error || 'Falha ao gerar QR code'}</div>
              <button
                onClick={fetchQRCode}
                className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {status === 'qr_ready' && qrCode && (
            <div className="bg-white rounded-lg p-4 inline-block">
              <img
                src={qrCode}
                alt="QR Code do WhatsApp"
                className="w-64 h-64"
              />
            </div>
          )}

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-white">Instruções</h3>
            <ol className="text-left text-gray-400 space-y-2">
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">1.</span>
                Abra o WhatsApp no seu celular
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">2.</span>
                Toque em Menu ou Configurações e selecione "Aparelhos Conectados"
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">3.</span>
                Toque em "Conectar um Aparelho"
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">4.</span>
                Aponte o celular para esta tela para escanear o QR code
              </li>
            </ol>
          </div>

          {status === 'qr_ready' && (
            <p className="mt-6 text-gray-500 text-sm">
              Aguardando escaneamento... Esta página redirecionará automaticamente quando conectado.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
