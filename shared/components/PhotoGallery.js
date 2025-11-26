/**
 * Photo Gallery Component
 * Enhanced photo management with preview, reorder, and captions
 */

(function() {
    'use strict';

    const { useState } = React;

    /**
     * PhotoItem Component - Single photo with preview, caption, and controls
     */
    function PhotoItem({ photo, index, onRemove, onMoveUp, onMoveDown, onCaptionChange, isFirst, isLast, darkMode }) {
        const [showPreview, setShowPreview] = useState(false);
        const isImage = photo.type?.startsWith('image/') || photo.dataURL?.startsWith('data:image/');

        return React.createElement(
            'div',
            { className: `border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'} rounded-lg p-3 mb-3` },
            React.createElement(
                'div',
                { className: 'flex gap-3' },
                // Preview/Thumbnail
                isImage && React.createElement(
                    'div',
                    {
                        className: 'flex-shrink-0 cursor-pointer',
                        onClick: () => setShowPreview(true)
                    },
                    React.createElement('img', {
                        src: photo.dataURL,
                        alt: photo.name,
                        className: 'w-16 h-16 md:w-20 md:h-20 object-cover rounded border border-gray-300',
                        title: 'Click to preview',
                        loading: 'lazy'
                    })
                ),
                // Details and controls
                React.createElement(
                    'div',
                    { className: 'flex-1 min-w-0' },
                    // File name
                    React.createElement(
                        'div',
                        { className: `text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}` },
                        photo.name
                    ),
                    // File size
                    React.createElement(
                        'div',
                        { className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}` },
                        photo.size || 'Unknown size'
                    ),
                    // Caption input
                    React.createElement('input', {
                        type: 'text',
                        placeholder: 'Add caption (optional)',
                        value: photo.caption || '',
                        onChange: (e) => onCaptionChange(index, e.target.value),
                        className: `mt-2 w-full px-2 py-1 text-sm border rounded ${
                            darkMode
                                ? 'bg-gray-600 border-gray-500 text-gray-200'
                                : 'bg-white border-gray-300 text-gray-700'
                        } focus:ring-2 focus:ring-green-500 focus:border-transparent`,
                        maxLength: 200
                    })
                ),
                // Action buttons
                React.createElement(
                    'div',
                    { className: 'flex flex-col gap-1' },
                    // Move up button
                    !isFirst && React.createElement(
                        'button',
                        {
                            onClick: () => onMoveUp(index),
                            className: `p-1 rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`,
                            title: 'Move up'
                        },
                        '▲'
                    ),
                    // Move down button
                    !isLast && React.createElement(
                        'button',
                        {
                            onClick: () => onMoveDown(index),
                            className: `p-1 rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`,
                            title: 'Move down'
                        },
                        '▼'
                    ),
                    // Remove button
                    React.createElement(
                        'button',
                        {
                            onClick: () => onRemove(index),
                            className: 'p-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors mt-auto',
                            title: 'Remove'
                        },
                        '×'
                    )
                )
            ),
            // Full-size preview modal
            showPreview && React.createElement(PhotoPreviewModal, {
                photo,
                onClose: () => setShowPreview(false),
                darkMode
            })
        );
    }

    /**
     * Photo Preview Modal - Full-size image preview
     */
    function PhotoPreviewModal({ photo, onClose, darkMode }) {
        return React.createElement(
            'div',
            {
                className: 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4',
                onClick: onClose
            },
            React.createElement(
                'div',
                {
                    className: 'relative max-w-4xl w-full max-h-full',
                    onClick: (e) => e.stopPropagation()
                },
                // Close button
                React.createElement(
                    'button',
                    {
                        onClick: onClose,
                        className: 'absolute -top-8 sm:-top-10 right-0 text-white text-2xl sm:text-3xl font-bold hover:text-gray-300',
                        title: 'Close preview'
                    },
                    '×'
                ),
                // Image
                React.createElement('img', {
                    src: photo.dataURL,
                    alt: photo.name,
                    className: 'max-w-full max-h-[85vh] sm:max-h-[90vh] object-contain rounded shadow-2xl'
                }),
                // Caption
                photo.caption && React.createElement(
                    'div',
                    { className: 'mt-2 text-center text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded' },
                    photo.caption
                )
            )
        );
    }

    /**
     * PhotoGallery Component - Main photo gallery with all features
     */
    function PhotoGallery({ photos, onPhotosChange, section = 'details', darkMode = false }) {
        // Handle undefined or null photos
        if (!photos || !Array.isArray(photos)) return null;

        const handleRemove = (index) => {
            const newPhotos = photos.filter((_, i) => i !== index);
            onPhotosChange(newPhotos);
        };

        const handleMoveUp = (index) => {
            if (index === 0) return;
            const newPhotos = [...photos];
            [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
            onPhotosChange(newPhotos);
        };

        const handleMoveDown = (index) => {
            if (index === photos.length - 1) return;
            const newPhotos = [...photos];
            [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
            onPhotosChange(newPhotos);
        };

        const handleCaptionChange = (index, caption) => {
            const newPhotos = [...photos];
            newPhotos[index] = { ...newPhotos[index], caption };
            onPhotosChange(newPhotos);
        };

        if (photos.length === 0) return null;

        return React.createElement(
            'div',
            { className: 'mt-4' },
            React.createElement(
                'div',
                { className: `text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}` },
                `${photos.length} photo${photos.length !== 1 ? 's' : ''} uploaded`
            ),
            photos.map((photo, index) =>
                React.createElement(PhotoItem, {
                    key: index,
                    photo,
                    index,
                    onRemove: handleRemove,
                    onMoveUp: handleMoveUp,
                    onMoveDown: handleMoveDown,
                    onCaptionChange: handleCaptionChange,
                    isFirst: index === 0,
                    isLast: index === photos.length - 1,
                    darkMode
                })
            )
        );
    }

    // Export components
    window.PhotoGallery = PhotoGallery;
    window.PhotoItem = PhotoItem;
    window.PhotoPreviewModal = PhotoPreviewModal;

    console.log('✓ PhotoGallery components initialized');

})();
