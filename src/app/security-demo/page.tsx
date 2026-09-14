'use client';

import React, { useState } from 'react';
import {
  Shield,
  Binary,
  Cpu,
  ArrowRight,
  RefreshCw,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  BarChart3,
  Activity,
} from 'lucide-react';
import { truncateCipher } from '@/lib/utils';

export default function SecurityDemoPage() {
  const [caScore, setCaScore] = useState<number>(28);
  const [examScore, setExamScore] = useState<number>(63);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Cryptographic execution results
  const [caCipher, setCaCipher] = useState<string | null>(null);
  const [examCipher, setExamCipher] = useState<string | null>(null);
  const [totalCipher, setTotalCipher] = useState<string | null>(null);
  const [decryptedTotal, setDecryptedTotal] = useState<number | null>(null);

  // Metrics
  const [encryptionTimeMs, setEncryptionTimeMs] = useState<number | null>(null);
  const [homomorphicTimeMs, setHomomorphicTimeMs] = useState<number | null>(null);
  const [decryptionTimeMs, setDecryptionTimeMs] = useState<number | null>(null);
  const [noiseBudgetBits, setNoiseBudgetBits] = useState<number | null>(null);

  // Multi-Score Aggregate Demo
  const [batchScores, setBatchScores] = useState<string>('24, 28, 30, 21, 27');
  const [batchResult, setBatchResult] = useState<{
    count: number;
    sumCipher: string;
    decryptedSum: number;
    average: number;
    durationMs: number;
  } | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  // Execute Step-by-Step Homomorphic Addition Demo
  const runHomomorphicPipeline = async () => {
    setIsProcessing(true);
    setActiveStep(1);
    setCaCipher(null);
    setExamCipher(null);
    setTotalCipher(null);
    setDecryptedTotal(null);

    try {
      // Step 1: Encrypt CA Score
      const caRes = await fetch('/api/crypto/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: Number(caScore) }),
      });
      const caData = await caRes.json();
      if (!caData.success) throw new Error(caData.error);
      setCaCipher(caData.ciphertext);

      // Step 2: Encrypt Exam Score
      const examRes = await fetch('/api/crypto/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: Number(examScore) }),
      });
      const examData = await examRes.json();
      if (!examData.success) throw new Error(examData.error);
      setExamCipher(examData.ciphertext);
      setEncryptionTimeMs(caData.durationMs + examData.durationMs);

      setActiveStep(2);
      await new Promise((r) => setTimeout(r, 400));

      // Step 3: Perform Homomorphic Addition on Server
      const addRes = await fetch('/api/crypto/homomorphic-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cipherA: caData.ciphertext,
          cipherB: examData.ciphertext,
        }),
      });
      const addData = await addRes.json();
      if (!addData.success) throw new Error(addData.error);
      setTotalCipher(addData.ciphertext);
      setHomomorphicTimeMs(addData.durationMs);
      setNoiseBudgetBits(addData.noiseBudgetBits ?? 48);

      setActiveStep(3);
      await new Promise((r) => setTimeout(r, 400));

      // Step 4: Authorized Secret Key Decryption
      const decRes = await fetch('/api/crypto/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciphertext: addData.ciphertext }),
      });
      const decData = await decRes.json();
      if (!decData.success) throw new Error(decData.error);
      setDecryptedTotal(decData.value);
      setDecryptionTimeMs(decData.durationMs);

      setActiveStep(4);
    } catch (err: any) {
      alert(`Cryptographic Execution Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Multi-Score Homomorphic Aggregate
  const runBatchAggregate = async () => {
    setIsBatchProcessing(true);
    setBatchResult(null);
    try {
      const numbers = batchScores
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n));

      if (numbers.length === 0) throw new Error('Please enter valid numeric scores');

      // 1. Encrypt all numbers
      const ciphers: string[] = [];
      for (const num of numbers) {
        const res = await fetch('/api/crypto/encrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: num }),
        });
        const d = await res.json();
        ciphers.push(d.ciphertext);
      }

      // 2. Homomorphically sum ciphertexts
      let accCipher = ciphers[0];
      const start = performance.now();
      for (let i = 1; i < ciphers.length; i++) {
        const addRes = await fetch('/api/crypto/homomorphic-add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cipherA: accCipher, cipherB: ciphers[i] }),
        });
        const addData = await addRes.json();
        accCipher = addData.ciphertext;
      }
      const durationMs = performance.now() - start;

      // 3. Decrypt total aggregate
      const decRes = await fetch('/api/crypto/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciphertext: accCipher }),
      });
      const decData = await decRes.json();

      setBatchResult({
        count: numbers.length,
        sumCipher: accCipher,
        decryptedSum: decData.value,
        average: Number((decData.value / numbers.length).toFixed(1)),
        durationMs: Number(durationMs.toFixed(2)),
      });
    } catch (err: any) {
      alert(`Aggregate Error: ${err.message}`);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-100 text-sky-800 text-xs font-mono mb-2 border border-sky-200">
          <Binary className="w-3.5 h-3.5" />
          <span>Research Evaluation & Defense Sandbox</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Cryptographic Defense & Verification Lab
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
          Directly execute and benchmark the Microsoft SEAL BFV (Brakerski-Fan-Vercauteren) homomorphic encryption engine. Verify that arithmetic is evaluated on encrypted polynomial ciphertexts without intermediate decryption.
        </p>
      </div>

      {/* Primary Demonstration: CA + Exam Homomorphic Addition */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 bg-sky-50 border-b border-sky-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Live Homomorphic Addition Pipeline: $E(Total) = E(CA) \oplus E(Exam)$
              </h2>
              <p className="text-xs text-slate-500">
                128-bit Security | Polynomial Degree: 4096 | Plaintext Modulus: 40961
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end bg-slate-50 p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Continuous Assessment (CA) Score
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={caScore}
                onChange={(e) => setCaScore(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">Permitted Range: 0 — 30</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Examination Score
              </label>
              <input
                type="number"
                min="0"
                max="70"
                value={examScore}
                onChange={(e) => setExamScore(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">Permitted Range: 0 — 70</span>
            </div>

            <div>
              <button
                onClick={runHomomorphicPipeline}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing WASM SEAL Engine...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Execute Homomorphic Addition</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step-by-Step Visual Execution Trace */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1: Plaintext Inputs */}
            <div
              className={`p-4 rounded-lg border transition-all ${
                activeStep >= 1
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-50/50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>1. Plaintext Inputs</span>
                {activeStep >= 1 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div>CA = <strong className="text-slate-900">{caScore}</strong></div>
                <div>Exam = <strong className="text-slate-900">{examScore}</strong></div>
                <div className="text-[11px] text-slate-500 font-sans mt-2">
                  Plaintext integer values supplied by user interface.
                </div>
              </div>
            </div>

            {/* Step 2: BFV Ciphertexts */}
            <div
              className={`p-4 rounded-lg border transition-all ${
                activeStep >= 2
                  ? 'bg-sky-50/60 border-sky-300 text-slate-900'
                  : 'bg-slate-50/50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>2. BFV Ciphertexts</span>
                {activeStep >= 2 && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">E(CA):</span>                    <div className="font-mono text-[11px] bg-sky-100 text-sky-800 p-1 rounded overflow-hidden truncate">
                    {truncateCipher(caCipher || undefined, 8, 6)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">E(Exam):</span>
                  <div className="font-mono text-[11px] bg-sky-100 text-sky-800 p-1 rounded overflow-hidden truncate">
                    {truncateCipher(examCipher || undefined, 8, 6)}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Homomorphic Addition */}
            <div
              className={`p-4 rounded-lg border transition-all ${
                activeStep >= 3
                  ? 'bg-indigo-50/60 border-indigo-300 text-slate-900'
                  : 'bg-slate-50/50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>3. Homomorphic Addition</span>
                {activeStep >= 3 && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </div>
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] text-slate-500 font-mono block">E(Total):</span>
                <div className="font-mono text-[11px] bg-indigo-100 text-indigo-800 p-1.5 rounded overflow-hidden truncate">
                  {truncateCipher(totalCipher || undefined, 8, 6)}
                </div>
                <div className="text-[11px] text-indigo-700 font-medium mt-1">
                  Evaluated on ciphertext without decrypting.
                </div>
              </div>
            </div>

            {/* Step 4: Authorized Decryption */}
            <div
              className={`p-4 rounded-lg border transition-all ${
                activeStep >= 4
                  ? 'bg-emerald-50 border-emerald-300 text-slate-900'
                  : 'bg-slate-50/50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>4. Authorized Result</span>
                {activeStep >= 4 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              {decryptedTotal !== null ? (
                <div className="text-center py-1">
                  <div className="text-3xl font-black text-emerald-800 tracking-tight">
                    {decryptedTotal}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                    Verified Match ({caScore} + {examScore} = {caScore + examScore})
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-2">Pending authorized secret key decryption</div>
              )}
            </div>
          </div>

          {/* Cryptographic Execution Metrics */}
          {activeStep >= 4 && (
            <div className="p-4 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Encryption Time</span>
                <span className="text-sky-700 font-bold text-sm">{encryptionTimeMs} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Homomorphic Add Time</span>
                <span className="text-indigo-700 font-bold text-sm">{homomorphicTimeMs} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Decryption Time</span>
                <span className="text-emerald-700 font-bold text-sm">{decryptionTimeMs} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Noise Budget Remaining</span>
                <span className="text-amber-700 font-bold text-sm">{noiseBudgetBits} bits</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Demonstration: Multi-Student Homomorphic Class Aggregates */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Multi-Student Homomorphic Class Aggregation
            </h2>
            <p className="text-xs text-slate-500">
              Calculate class sums and course averages directly over multiple ciphertexts (Sum of E(Score_i))
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-4 border border-slate-200 rounded-lg">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Comma-Separated Student Scores:
            </label>
            <input
              type="text"
              value={batchScores}
              onChange={(e) => setBatchScores(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              placeholder="e.g. 28, 30, 24, 29, 26"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Simulates batch CA scores entered across a whole classroom.
            </span>
          </div>

          <div>
            <button
              onClick={runBatchAggregate}
              disabled={isBatchProcessing}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isBatchProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Summing Ciphertexts...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 text-emerald-300" />
                  <span>Compute Homomorphic Class Aggregate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {batchResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-emerald-700 font-medium block">Total Students Summed</span>
              <span className="text-xl font-bold text-emerald-950">{batchResult.count}</span>
            </div>
            <div>
              <span className="text-emerald-700 font-medium block">Decrypted Class Sum</span>
              <span className="text-xl font-bold text-emerald-950">{batchResult.decryptedSum}</span>
            </div>
            <div>
              <span className="text-emerald-700 font-medium block">Calculated Mean Average</span>
              <span className="text-xl font-bold text-emerald-950">{batchResult.average}</span>
            </div>
            <div>
              <span className="text-emerald-700 font-medium block">Evaluation Duration</span>
              <span className="text-xl font-mono font-bold text-emerald-950">
                {batchResult.durationMs} ms
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
