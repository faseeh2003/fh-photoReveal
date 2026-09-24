import React, { useState } from 'react';
import { MessageSquare, Link as LinkIcon, Check, Play, PlusCircle, Share2 } from 'lucide-react';
import { PuzzleData } from '../types/puzzle';
import { buildPuzzleShareUrl, buildWhatsAppShareUrl } from '../utils/puzzleStorage';

interface ShareViewProps {
  puzzle: PuzzleData;
  onSolveNow: () => void;
  onCreateAnother: () => void;
}

export const ShareView: React.FC<ShareViewProps> = ({
  puzzle,
  onSolveNow,
  onCreateAnother,
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = buildPuzzleShareUrl(puzzle.id);
  const whatsappUrl = buildWhatsAppShareUrl(shareUrl);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'I made a photo puzzle for you 🧩',
          text: 'Can you solve it and reveal the photo? 👀',
          url: shareUrl,
        });
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
            <span className="text-3xl">🧩</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Your puzzle is ready! 🧩
          </h1>
          <p className="text-sm text-neutral-600">
            Share this link with someone special and watch them reveal the surprise piece by piece.
          </p>
        </div>

        {/* Puzzle preview showing scrambled sliding tiles and empty space */}
        <div className="relative aspect-square w-48 sm:w-56 mx-auto rounded-2xl overflow-hidden border-2 border-neutral-200 shadow-md bg-neutral-200 p-1">
          <div
            className="w-full h-full grid gap-0.5"
            style={{
              gridTemplateColumns: `repeat(${puzzle.gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${puzzle.gridSize}, minmax(0, 1fr))`,
            }}
          >
            {(puzzle.initialBoard || Array.from({ length: puzzle.piecesCount }, (_, i) => i === puzzle.piecesCount - 1 ? null : i)).map((tileIndex, slotIdx) => {
              if (tileIndex === null) {
                return (
                  <div
                    key={`empty-${slotIdx}`}
                    className="w-full h-full bg-neutral-300/60 rounded-xs border border-dashed border-neutral-400/50 flex items-center justify-center text-[10px] text-neutral-400 font-bold"
                  >
                    [ ]
                  </div>
                );
              }
              const piece = puzzle.pieces[tileIndex];
              return (
                <div
                  key={piece ? piece.id : `slot-${slotIdx}`}
                  className="relative w-full h-full overflow-hidden bg-neutral-200 rounded-xs"
                >
                  {piece && (
                    <>
                      <img
                        src={piece.blurredDataUrl}
                        alt={`Tile ${piece.number}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white bg-black/45">
                        {piece.number}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="absolute inset-x-2 bottom-2 bg-black/70 backdrop-blur-xs text-white text-[11px] font-semibold py-1 rounded-md">
            {puzzle.piecesCount - 1} tiles + 1 empty space
          </div>
        </div>

        {/* Sharing Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all text-base cursor-pointer"
          >
            <MessageSquare className="w-5 h-5 fill-current" />
            <span>💬 Share on WhatsApp</span>
          </a>

          {/* Copy Link Button */}
          <button
            onClick={handleCopy}
            className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold transition-all text-sm cursor-pointer border ${
              copied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4 text-neutral-600" />
                <span>🔗 Copy Link</span>
              </>
            )}
          </button>

          {/* Native Share button if available */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 py-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>More share options</span>
            </button>
          )}
        </div>

        {/* Separator & Creator controls */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2">
          <button
            onClick={onSolveNow}
            className="w-full inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer text-sm"
          >
            <Play className="w-4 h-4 text-yellow-400 fill-current" />
            <span>Try Solving It Yourself</span>
          </button>

          <button
            onClick={onCreateAnother}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 py-2 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Another Puzzle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
