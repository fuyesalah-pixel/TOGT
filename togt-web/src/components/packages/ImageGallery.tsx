"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-gray-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={images[activeIndex]}
              alt={`${alt} — image ${activeIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority={activeIndex === 0}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnails — only shown if more than 1 image */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                i === activeIndex
                  ? "border-[#FF9300] shadow-md shadow-orange-200"
                  : "border-transparent opacity-60 hover:opacity-90"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
