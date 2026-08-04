import client from './client';

const handleResponse = (response) => response.data;

// ============================================
// Admin Authentication
// ============================================

/**
 * Initialize admin credentials (one-time setup, requires bootstrap secret)
 * @param {string} bootstrapSecret - Secret from server env (BOOTSTRAP_SECRET)
 * @returns {Promise<{message: string, email: string, totp_secret: string}>}
 */
export const initAdminCredentials = async (bootstrapSecret) => {
    const response = await client.post('/admin/auth/init', null, {
        headers: { 'x-bootstrap-secret': bootstrapSecret }
    });
    return handleResponse(response);
};

/**
 * Admin login - FIRST STEP (email + password)
 * Returns a short-lived preauth token used in the TOTP step.
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<{message: string, email: string, preauth_token: string}>}
 */
export const loginUser = async (email, password) => {
    const response = await client.post('/admin/login', {
        email,
        password
    });
    return handleResponse(response);
};

/**
 * Complete login with TOTP (preauth token + code)
 * Sets HttpOnly session cookies on success.
 * @param {string} preauthToken - Token from loginUser()
 * @param {string} totpCode - 6-digit TOTP code
 * @returns {Promise<{message: string, email: string}>}
 */
export const verifyTOTP = async (preauthToken, totpCode) => {
    const response = await client.post('/admin/login/totp', {
        preauth_token: preauthToken,
        totp_code: totpCode
    });
    return handleResponse(response);
};

/**
 * Get current admin email (session restored from HttpOnly cookie)
 * @returns {Promise<{email: string, valid: boolean}>}
 */
export const getCurrentAdmin = async () => {
    const response = await client.get('/admin/auth');
    return handleResponse(response);
};

/**
 * Logout admin user (revokes refresh tokens server-side)
 * @returns {Promise<{message: string}>}
 */
export const logoutUser = async () => {
    const response = await client.post('/admin/logout');
    return handleResponse(response);
};

/**
 * Start TOTP rotation: prove the current device code, get a new secret
 * @param {string} totpCode - Current 6-digit TOTP code
 * @returns {Promise<{totp_secret: string, otpauth_uri: string}>}
 */
export const rotateTOTP = async (totpCode) => {
    const response = await client.post('/admin/auth/totp/rotate', {
        totp_code: totpCode
    });
    return handleResponse(response);
};

/**
 * Confirm the pending TOTP secret with a code from the new device
 * @param {string} totpCode - 6-digit code from the NEW device
 * @returns {Promise<{message: string}>}
 */
export const confirmTOTP = async (totpCode) => {
    const response = await client.post('/admin/auth/totp/confirm', {
        totp_code: totpCode
    });
    return handleResponse(response);
};

export default client;
