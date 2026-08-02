import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTOTP } from '../context/TOTPContext';

const LoginPage = () => {
    const [step, setStep] = useState('credentials'); // 'credentials' | 'totp'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);

    const { login, verifyTOTP, isAuthenticated, booting, loading, error: contextError } = useTOTP();
    const navigate = useNavigate();

    useEffect(() => {
        if (!booting && isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, booting, navigate]);

    useEffect(() => {
        if (contextError) {
            setError(contextError);
        }
    }, [contextError]);

    useEffect(() => {
        if (step === 'totp') {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) return 30;
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [step]);

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            setStep('totp');
            setTimeLeft(30);
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        }
    };

    const handleTOTPSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await verifyTOTP(totpCode);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid TOTP code');
            setTotpCode('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Admin Login
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Use your email/password and Google Authenticator for 2FA
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 neo-card">
                    {step === 'credentials' && (
                        <form className="space-y-6" onSubmit={handleCredentialsSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="neo-input w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="neo-input w-full"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Next'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'totp' && (
                        <form className="space-y-6" onSubmit={handleTOTPSubmit}>
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Enter your 6-digit code from Google Authenticator
                                </p>
                                <p className="mt-1 text-sm font-mono text-indigo-600">
                                    Time remaining: {timeLeft}s
                                </p>
                            </div>

                            <div>
                                <label htmlFor="totp" className="block text-sm font-medium text-gray-700">
                                    6-Digit Code
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="totp"
                                        name="totp"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]{6}"
                                        maxLength={6}
                                        required
                                        value={totpCode}
                                        onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="neo-input w-full text-center text-2xl font-mono"
                                        placeholder="123456"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading || totpCode.length !== 6}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Verify & Login'}
                                </button>
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('credentials');
                                        setTotpCode('');
                                        setError('');
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    &larr; Back
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
