'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'welcome' | 'api-key' | 'sample' | 'done';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [isSeedingSample, setIsSeedingSample] = useState(false);
  const [sampleSeeded, setSampleSeeded] = useState(false);
  const [error, setError] = useState('');

  const handleSeedSample = async () => {
    setIsSeedingSample(true);
    setError('');
    try {
      const response = await fetch('/api/setup/seed-sample', { method: 'POST' });
      if (response.ok) {
        setSampleSeeded(true);
      } else {
        setError('The lizards intercepted the seed request. Try running "npm run seed:sample" from the terminal instead.');
      }
    } catch {
      setError('Network error. The cold-blooded ones may be jamming our signal. Try "npm run seed:sample" from the terminal.');
    } finally {
      setIsSeedingSample(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            FORGE
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            PostScarcity AI
          </p>
        </div>

        {step === 'welcome' && (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <p className="text-muted-foreground leading-relaxed">
                AI image and video generation platform. Let&apos;s get you set up.
              </p>
            </div>
            <button
              onClick={() => setStep('api-key')}
              className="w-full py-3 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
            <button
              onClick={() => router.push('/default')}
              className="w-full py-3 border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Skip setup
            </button>
          </div>
        )}

        {step === 'api-key' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">fal.ai API Key</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Forge uses fal.ai for image and video generation. Add your API key
                to <code className="font-mono text-xs bg-accent px-1.5 py-0.5 rounded">.env.local</code> in the project root:
              </p>
              <div className="bg-accent rounded-md p-4 font-mono text-sm text-foreground">
                FAL_KEY=your_key_here
              </div>
              <p className="text-xs text-muted-foreground">
                Get a key at{' '}
                <a
                  href="https://fal.ai/dashboard/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  fal.ai/dashboard/keys
                </a>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('welcome')}
                className="px-4 py-3 border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep('sample')}
                className="flex-1 py-3 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 'sample' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Sample Project</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Forge includes a sample project — <strong className="text-foreground">Lizard Overlords: A Protest</strong> — a
                postmodern poster series featuring citizens rising up against their
                reptilian rulers. It demonstrates characters, scenes, and the prompt system.
              </p>
            </div>

            {error && (
              <div className="bg-accent rounded-md p-3 text-sm text-muted-foreground">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {!sampleSeeded ? (
                <button
                  onClick={handleSeedSample}
                  disabled={isSeedingSample}
                  className="w-full py-3 border border-border rounded-md font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {isSeedingSample ? 'Seeding the resistance...' : 'Seed Sample Project'}
                </button>
              ) : (
                <div className="text-center py-3 text-sm text-foreground">
                  Sample project created. The resistance lives.
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Or run <code className="font-mono bg-accent px-1 py-0.5 rounded">npm run seed:sample</code> from the terminal
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('api-key')}
                className="px-4 py-3 border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep('done')}
                className="flex-1 py-3 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
              >
                Finish
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-6 text-center">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">You&apos;re ready</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Open a project, build a prompt, and generate. As of March 2026,
                we recommend <strong className="text-foreground">Nano Banana 2</strong> for images
                and <strong className="text-foreground">Veo 3.1</strong> for video.
              </p>
            </div>
            <button
              onClick={() => router.push(sampleSeeded ? '/lizard-overlords' : '/default')}
              className="w-full py-3 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Open Forge
            </button>
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground">
          PostScarcity AI. Unlock Abundance.
        </p>
      </div>
    </main>
  );
}
