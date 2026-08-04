// Utility to compress image and convert to WebP

export const compressImage = async (file, quality = 0.8) => {
    // If it's a GIF, return as is to preserve animation
    if (file.type === 'image/gif') {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Resize logic if needed (optional, keeping original dimensions for now)
                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
                                type: 'image/webp',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error("Canvas to Blob failed"));
                        }
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
