import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { SAMPLE_PHOTOS } from '../utils/sampleImages';

interface UploadViewProps {
  onCreatePuzzle: (fileOrUrl: File | string, pieceCount: number) => Promise<void>;
  isProcessing: boolean;
  processingStep: string;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onCreatePuzzle,
  isProcessing,
  processingStep,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pieceCount, setPieceCount] = useState<number>(16); // Default: 16
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pieceOptions = [
    { count: 9, label: '9 pieces', grid: '3 × 3' },
    { count: 16, label: '16 pieces', grid: '4 × 4', popular: true },
    { count: 25, label: '25 pieces', grid: '5 × 5' },
    { count: 36, label: '36 pieces', grid: '6 × 6' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSelectSample = (url: string) => {
    setSelectedFile(null);
    setPreviewUrl(url);
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleResetPhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    if (!previewUrl) return;
    if (selectedFile) {
      await onCreatePuzzle(selectedFile, pieceCount);
    } else {
      await onCreatePuzzle(previewUrl, pieceCount);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 sm:py-12">
      {/* Hidden File Input supporting JPG, JPEG, PNG, WEBP */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
      />

      {!previewUrl ? (
        /* 1. HOME LANDING VIEW */
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Photo Surprise</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              Turn a Photo Into a Surprise 🧩
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 max-w-md mx-auto">
              Upload a photo, scramble it into a sliding puzzle, and let someone reveal it piece by piece.
            </p>
          </div>

          {/* Large Upload Button */}
          <div className="w-full pt-4">
            <button
              onClick={handleTriggerUpload}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all cursor-pointer"
            >
              <Camera className="w-6 h-6 text-yellow-400" />
              <span>📷 Upload Photo</span>
            </button>
            <p className="text-xs text-neutral-400 mt-2">
              Supports JPG, JPEG, PNG, WEBP
            </p>
          </div>

          {/* Or Sample Photos helper */}
          <div className="w-full pt-8 border-t border-neutral-100 mt-8">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-3">
              Or test with a sample photo
            </p>
            <div className="flex items-center justify-center gap-3">
              {SAMPLE_PHOTOS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample.url)}
                  className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-neutral-200 hover:border-indigo-500 shadow-sm transition-all cursor-pointer focus:outline-hidden"
                  title={sample.name}
                >
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 2 & 3. PREVIEW & PUZZLE SETTINGS */
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">Customize Puzzle</h2>
            <button
              onClick={handleResetPhoto}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change Photo</span>
            </button>
          </div>

          {/* Photo Preview */}
          <div className="relative aspect-square w-full max-w-[320px] mx-auto rounded-2xl overflow-hidden border-2 border-neutral-100 shadow-inner bg-neutral-100">
            <img
              src={previewUrl}
              alt="Selected for puzzle"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg text-center font-medium">
              Actual uploaded photo
            </div>
          </div>

          {/* Setting: Number of Pieces */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-neutral-900">
                Number of Pieces
              </label>
              <span className="text-xs text-neutral-500">
                Grid: {pieceOptions.find((p) => p.count === pieceCount)?.grid}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {pieceOptions.map((opt) => {
                const isSelected = pieceCount === opt.count;
                return (
                  <button
                    key={opt.count}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setPieceCount(opt.count)}
                    className={`relative py-3 px-2 rounded-xl text-center font-bold text-sm transition-all cursor-pointer border ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-neutral-50/60'
                    }`}
                  >
                    <div className="text-base sm:text-lg font-black">{opt.count}</div>
                    <div className="text-[10px] text-neutral-400 font-medium">
                      {opt.grid}
                    </div>
                    {opt.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-semibold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                        Default
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={handleCreate}
              disabled={isProcessing}
              className="w-full inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{processingStep || 'Creating Puzzle...'}</span>
                </>
              ) : (
                <>
                  <span>Create Puzzle →</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              onClick={handleTriggerUpload}
              disabled={isProcessing}
              className="w-full text-center text-sm font-semibold text-neutral-600 hover:text-neutral-900 py-2 cursor-pointer disabled:opacity-50"
            >
              Select Different Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
