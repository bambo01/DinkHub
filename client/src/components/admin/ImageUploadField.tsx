"use client";

import { useRef } from "react";
import type { IconType } from "react-icons";
import { FiCamera } from "react-icons/fi";

interface ImageUploadFieldProps {
  imageUrl: string | null;
  onFileSelected: (file: File) => void;
  isUploading?: boolean;
  fallbackIcon: IconType;
  label: string;
}

export function ImageUploadField({
  imageUrl,
  onFileSelected,
  isUploading,
  fallbackIcon: FallbackIcon,
  label,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-secondary">{label}</p>
      <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-secondary to-secondary/70">
        {imageUrl ? (
          // Uploaded images are served from Supabase Storage's public
          // bucket — a plain <img> avoids needing that domain allow-listed
          // for next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <FallbackIcon className="h-12 w-12 text-primary/80" />
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Change image"
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-secondary shadow disabled:opacity-50"
        >
          <FiCamera className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onFileSelected(file);
          }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {isUploading ? "Uploading…" : "JPG or PNG, up to 5MB."}
      </p>
    </div>
  );
}
