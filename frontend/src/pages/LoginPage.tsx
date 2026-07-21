import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/errorHandler';
import { Eye, EyeOff, LogIn } from 'lucide-react';

// Tooth Logo SVG
const ToothLogo = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16" fill="currentColor">
    <path d="M50 5C35 5 25 15 20 30C15 45 15 60 20 75C25 90 35 95 50 95C65 95 75 90 80 75C85 60 85 45 80 30C75 15 65 5 50 5ZM50 15C60 15 67 22 70 35C73 48 73 58 70 70C67 82 60 85 50 85C40 85 33 82 30 70C27 58 27 48 30 35C33 22 40 15 50 15Z" />
  </svg>
);

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dental-50 to-dental-100">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      showToast('Connexion réussie!', 'success');
      navigate('/');
    } catch (error: any) {
      const message = getErrorMessage(error, 'Erreur de connexion');
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dental-50 via-white to-dental-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dental-500 text-white mb-4 shadow-lg">
            <ToothLogo />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Cabinet Dentaire</h1>
          <p className="text-gray-600 mt-2">Connectez-vous à votre compte</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500 transition-colors"
                placeholder="exemple@cabinet.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500 transition-colors pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 text-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="spinner w-5 h-5" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials info */}
        <div className="mt-6 p-4 bg-dental-50 rounded-lg border border-dental-100">
          <p className="text-sm text-dental-700 font-medium mb-2">Identifiants par défaut:</p>
          <div className="text-sm text-dental-600 space-y-1">
            <p><strong>Dentiste:</strong> dentiste@cabinet.com / admin123</p>
            <p><strong>Secrétaire:</strong> secretaire@cabinet.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

