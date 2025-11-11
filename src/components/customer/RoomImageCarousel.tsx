import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RoomImageCarouselProps {
    images: string[];
    alt: string;
}

export default function RoomImageCarousel({ images, alt }: RoomImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

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
            <img
                src={images[currentIndex]}
                alt={alt}
                loading="lazy"
                className="w-full h-full object-cover"
            />

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
