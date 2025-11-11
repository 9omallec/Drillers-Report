/**
 * Image Processing Utilities
 * Handles image compression and manipulation
 */

const ImageUtils = {
    /**
     * Compress an image file
     * @param {File} file - Image file to compress
     * @param {number} maxWidth - Maximum width in pixels (default: 1920)
     * @param {number} quality - JPEG quality 0-1 (default: 0.85)
     * @returns {Promise<Blob>} Compressed image blob
     */
    compressImage(file, maxWidth = 1920, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate new dimensions
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Compression failed'));
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };

                img.onerror = reject;
                img.src = e.target.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Convert blob to base64 data URL
     * @param {Blob} blob - Blob to convert
     * @returns {Promise<string>} Base64 data URL
     */
    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    /**
     * Get image dimensions
     * @param {File|Blob} file - Image file
     * @returns {Promise<Object>} Object with width and height
     */
    getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve({
                    width: img.width,
                    height: img.height
                });
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    },

    /**
     * Resize image to specific dimensions
     * @param {File} file - Image file
     * @param {number} width - Target width
     * @param {number} height - Target height
     * @returns {Promise<Blob>} Resized image blob
     */
    resizeImage(file, width, height) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    canvas.width = width;
                    canvas.height = height;

                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Resize failed'));
                            }
                        },
                        'image/jpeg',
                        0.9
                    );
                };

                img.onerror = reject;
                img.src = e.target.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
};

// Export utilities
window.ImageUtils = ImageUtils;
