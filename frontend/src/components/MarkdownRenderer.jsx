import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MarkdownContent } from './MarkdownComponents';

const MarkdownRenderer = ({ content }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    const openLightbox = useCallback((src, alt) => setSelectedImage({ src, alt: alt || 'Enlarged view' }), []);
    const closeLightbox = useCallback(() => setSelectedImage(null), []);

    useEffect(() => {
        if (!selectedImage) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeLightbox();
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [selectedImage, closeLightbox]);

    return (
        <div>
            <MarkdownContent content={content} onLightbox={openLightbox} />

            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8 cursor-pointer backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image preview"
                    onClick={closeLightbox}
                >
                    <button
                        type="button"
                        onClick={closeLightbox}
                        aria-label="Close image preview"
                        className="absolute top-6 right-6 text-white hover:text-yellow-400 transition-colors bg-black/50 p-2 rounded-full pointer-events-auto"
                    >
                        <X size={32} strokeWidth={3} />
                    </button>
                    <img
                        src={selectedImage.src}
                        alt={selectedImage.alt}
                        className="max-w-full max-h-[90vh] object-contain border-4 border-white shadow-2xl pointer-events-none"
                    />
                </div>
            )}
        </div>
    );
};

export default MarkdownRenderer;