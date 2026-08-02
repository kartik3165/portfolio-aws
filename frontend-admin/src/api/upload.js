import client from './client';

/**
 * Get presigned upload URL from backend
 */
export const getPresignedUrl = async (
    filename,
    contentType,
    folder = 'misc'
) => {
    const response = await client.post('/admin/upload/presigned-url', {
        filename,
        content_type: contentType,
        folder
    });

    return response.data;
};

/**
 * Upload file directly to Cloudflare R2 using presigned URL
 * IMPORTANT:
 * - Do NOT add auth headers
 * - Do NOT use multipart/form-data
 */
export const uploadFileToUrl = async (url, file) => {
    const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type,
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${text}`);
    }

    return response;
};


/**
 * Upload file directly through backend (avoids CORS issues)
 */
export const uploadFile = async (file, folder = 'misc') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await client.post('/admin/upload/upload-file', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};
