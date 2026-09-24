import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { UploadView } from './components/UploadView';
import { ShareView } from './components/ShareView';
import { PuzzleBoard } from './components/PuzzleBoard';
import { PuzzleData } from './types/puzzle';
import { createPuzzleFromImage } from './utils/imageProcessor';
import { savePuzzle, fetchPuzzle } from './utils/puzzleStorage';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'upload' | 'share' | 'solve'>('upload');
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  // Uploading / processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  // Is this an incoming recipient view?
  const [isRecipient, setIsRecipient] = useState<boolean>(false);

  // Check URL query parameters for shared puzzle ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const puzzleId = params.get('p') || params.get('puzzle');

    if (puzzleId) {
      setIsLoadingInitial(true);
      fetchPuzzle(puzzleId)
        .then((puzzle) => {
          if (puzzle) {
            setCurrentPuzzle(puzzle);
            setCurrentView('solve');
            setIsRecipient(true);
          } else {
            setInitialError('The shared puzzle could not be found or may have expired.');
          }
        })
        .catch((err) => {
          console.error(err);
          setInitialError('Unable to load the puzzle. Please check your connection.');
        })
        .finally(() => {
          setIsLoadingInitial(false);
        });
    } else {
      setIsLoadingInitial(false);
    }
  }, []);

  // Handle creating puzzle from uploaded file or image URL
  const handleCreatePuzzle = async (
    fileOrUrl: File | string,
    pieceCount: number
  ) => {
    setIsProcessing(true);
    try {
      const gridSize = Math.round(Math.sqrt(pieceCount)); // 3 for 9, 4 for 16, 5 for 25, 6 for 36

      setProcessingStep('Preparing photograph...');
      await new Promise((r) => setTimeout(r, 100));

      setProcessingStep(`Creating ${pieceCount - 1} sliding tiles + empty space...`);
      const puzzle = await createPuzzleFromImage(fileOrUrl, gridSize);

      setProcessingStep('Saving your surprise puzzle...');
      await savePuzzle(puzzle);

      setCurrentPuzzle(puzzle);
      setCurrentView('share');
      setIsRecipient(false);

      // Update URL silently with ?p=ID
      if (window.history?.pushState) {
        const newUrl = `${window.location.pathname}?p=${puzzle.id}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    } catch (err: any) {
      console.error('Error creating puzzle:', err);
      alert('Could not create puzzle from this image. Please try another photo.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleGoHome = useCallback(() => {
    setCurrentView('upload');
    setCurrentPuzzle(null);
    setInitialError(null);
    setIsRecipient(false);
    // Clear URL query param
    if (window.history?.pushState) {
      window.history.pushState({}, '', window.location.pathname);
    }
  }, []);

  const handleSolveNow = useCallback(() => {
    setCurrentView('solve');
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onGoHome={handleGoHome}
        showNewButton={currentView !== 'upload'}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {isLoadingInitial ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-neutral-600">
              Loading puzzle...
            </p>
          </div>
        ) : initialError ? (
          <div className="w-full max-w-md mx-auto px-4 py-12 text-center space-y-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 text-rose-500">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-neutral-900">
                Puzzle Not Found
              </h2>
              <p className="text-sm text-neutral-500">
                {initialError}
              </p>
            </div>
            <button
              onClick={handleGoHome}
              className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 px-6 rounded-2xl shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Create a New Puzzle</span>
            </button>
          </div>
        ) : currentView === 'upload' ? (
          <UploadView
            onCreatePuzzle={handleCreatePuzzle}
            isProcessing={isProcessing}
            processingStep={processingStep}
          />
        ) : currentView === 'share' && currentPuzzle ? (
          <ShareView
            puzzle={currentPuzzle}
            onSolveNow={handleSolveNow}
            onCreateAnother={handleGoHome}
          />
        ) : currentView === 'solve' && currentPuzzle ? (
          <PuzzleBoard
            puzzle={currentPuzzle}
            onCreateAnother={handleGoHome}
            isRecipientView={isRecipient}
          />
        ) : null}
      </main>
    </div>
  );
}
