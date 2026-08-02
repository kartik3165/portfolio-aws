import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { getCurrentAdmin, rotateTOTP, confirmTOTP } from '../api/auth';

const AdminSettingsPage = () => {
    const [currentEmail, setCurrentEmail] = useState('');
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // TOTP rotation state
    const [totpStep, setTotpStep] = useState('idle'); // 'idle' | 'current' | 'new-secret' | 'confirm'
    const [currentTotpCode, setCurrentTotpCode] = useState('');
    const [newTotpCode, setNewTotpCode] = useState('');
    const [newTotpSecret, setNewTotpSecret] = useState('');
    const [otpauthUri, setOtpauthUri] = useState('');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [totpLoading, setTotpLoading] = useState(false);

    const fetchCurrentEmail = async () => {
        setFetching(true);
        try {
            const result = await getCurrentAdmin();
            if (result.email) {
                setCurrentEmail(result.email);
            }
        } catch (err) {
            console.error("Fetch Email Error", err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchCurrentEmail();
    }, []);

    const handleStartRotation = async (e) => {
        e.preventDefault();
        setTotpLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await rotateTOTP(currentTotpCode);
            setNewTotpSecret(result.totp_secret);
            setOtpauthUri(result.otpauth_uri);

            // Render QR locally - never send the secret to a third party
            const dataUrl = await QRCode.toDataURL(result.otpauth_uri, { width: 220 });
            setQrDataUrl(dataUrl);

            setTotpStep('new-secret');
            setCurrentTotpCode('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to start TOTP rotation. Check your current code.');
        } finally {
            setTotpLoading(false);
        }
    };

    const handleConfirmRotation = async (e) => {
        e.preventDefault();
        setTotpLoading(true);
        setError('');
        setSuccess('');

        try {
            await confirmTOTP(newTotpCode);
            setSuccess('Two-factor secret updated. Your authenticator app is now using the new code.');
            setTotpStep('idle');
            setNewTotpCode('');
            setNewTotpSecret('');
            setOtpauthUri('');
            setQrDataUrl('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid code for the new device.');
        } finally {
            setTotpLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 border-none bg-transparent shadow-none tracking-normal">
                        Settings
                    </h1>
                    <Link to="/" className="neo-button text-gray-600 border-gray-300 hover:bg-gray-50">
                        &larr; Back to Dashboard
                    </Link>
                </div>

                <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Admin Account
                                </h3>
                                <div className="mt-2 max-w-xl text-sm text-gray-500">
                                    <p>Current Email: <span className="font-semibold text-gray-900">{fetching ? 'Loading...' : (currentEmail || 'Not available')}</span></p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                                {success}
                            </div>
                        )}

                        {/* TOTP Rotation */}
                        <div className="mt-8 border-t border-gray-200 pt-6">
                            <h4 className="text-md font-semibold text-gray-900 mb-2">
                                Two-Factor Authentication (TOTP)
                            </h4>
                            <p className="text-sm text-gray-500 mb-4">
                                Rotate your Google Authenticator secret if your device was lost or compromised.
                                The new secret only becomes active after you confirm it with a code from the new device.
                            </p>

                            {totpStep === 'idle' && (
                                <button
                                    onClick={() => setTotpStep('current')}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Rotate TOTP Secret
                                </button>
                            )}

                            {totpStep === 'current' && (
                                <form onSubmit={handleStartRotation} className="space-y-4 max-w-sm">
                                    <div>
                                        <label htmlFor="current-totp" className="block text-sm font-medium text-gray-700">
                                            Current 6-Digit Code
                                        </label>
                                        <input
                                            id="current-totp"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]{6}"
                                            maxLength={6}
                                            required
                                            value={currentTotpCode}
                                            onChange={(e) => setCurrentTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="neo-input w-full text-center text-2xl font-mono mt-1"
                                            placeholder="123456"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={totpLoading || currentTotpCode.length !== 6}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {totpLoading ? 'Verifying...' : 'Get New Secret'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setTotpStep('idle'); setCurrentTotpCode(''); }}
                                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {totpStep === 'new-secret' && (
                                <div className="space-y-4">
                                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm">
                                        Scan this QR code with your authenticator app. The old secret is still active
                                        until you confirm the new one below.
                                    </div>

                                    <div className="flex justify-center">
                                        {qrDataUrl && (
                                            <img src={qrDataUrl} alt="New TOTP QR Code" className="border p-4 rounded bg-white" />
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Manual entry key:{' '}
                                            <code className="font-mono bg-gray-100 p-1 rounded">{newTotpSecret}</code>
                                        </p>
                                    </div>

                                    <form onSubmit={handleConfirmRotation} className="space-y-4 max-w-sm">
                                        <div>
                                            <label htmlFor="new-totp" className="block text-sm font-medium text-gray-700">
                                                Code from the NEW device
                                            </label>
                                            <input
                                                id="new-totp"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]{6}"
                                                maxLength={6}
                                                required
                                                value={newTotpCode}
                                                onChange={(e) => setNewTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="neo-input w-full text-center text-2xl font-mono mt-1"
                                                placeholder="123456"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                disabled={totpLoading || newTotpCode.length !== 6}
                                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {totpLoading ? 'Confirming...' : 'Confirm New Secret'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setTotpStep('idle'); setNewTotpCode(''); setNewTotpSecret(''); setOtpauthUri(''); setQrDataUrl(''); }}
                                                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Security Note
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>
                                    Sessions use HttpOnly, Secure, SameSite cookies. Passwords are hashed with Argon2id.
                                    Keep your authenticator app and recovery code safe - they are the second factor
                                    protecting this CMS.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettingsPage;
