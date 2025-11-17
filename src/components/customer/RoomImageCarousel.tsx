import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RoomImageCarouselProps {
    images: string[];
    alt: string;
}

export default function RoomImageCarousel({ images, alt }: RoomImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

    const handleImageError = (index: number) => {
        console.warn(`Image failed to load at index ${index}:`, images[index]);
        setImageErrors(prev => ({ ...prev, [index]: true }));
    };

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const goToSlide = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(index);
    };

    return (
        <div className="relative h-48 group">
            {/* Main Image */}
            {imageErrors[currentIndex] ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Ảnh không tải được</p>
                    </div>
                </div>
            ) : (
                <img
                    src={images[currentIndex]}
                    alt={alt}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(currentIndex)}
                    crossOrigin="anonymous"
                />
            )}

            {/* Navigation Arrows - Show on hover */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => goToSlide(index, e)}
                                className={`w-2 h-2 rounded-full transition-all ${currentIndex === index
                                    ? 'bg-white w-6'
                                    : 'bg-white/60 hover:bg-white/80'
                                    }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Image Counter */}
                    <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {currentIndex + 1} / {images.length}
                    </div>
                </>
            )}
        </div>
    );
}
