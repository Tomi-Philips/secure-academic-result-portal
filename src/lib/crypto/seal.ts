/**
 * Microsoft SEAL (node-seal) Cryptographic Service
 * Implements genuine Brakerski-Fan-Vercauteren (BFV) Homomorphic Encryption
 * for Academic Continuous Assessment and Examination Scores processing.
 */

// Dynamic import or typed wrapper for node-seal WebAssembly instance
let sealInstance: any = null;
let sealContext: any = null;
let sealBatchEncoder: any = null;
let sealEncryptor: any = null;
let sealDecryptor: any = null;
let sealEvaluator: any = null;
let sealPublicKey: any = null;
let sealSecretKey: any = null;
let sealKeyGenerator: any = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export interface SealOperationResult {
  ciphertext: string;
  noiseBudgetBits?: number;
  durationMs: number;
}

export interface HomomorphicSumResult {
  resultCiphertext: string;
  noiseBudgetBits?: number;
  durationMs: number;
  itemCount: number;
}

/**
 * Initializes the Microsoft SEAL WebAssembly runtime and BFV Cryptographic Context.
 * Uses 128-bit post-quantum security parameters standard for academic homomorphic evaluations.
 */
export async function getSealEngine() {
  if (isInitialized && sealInstance) {
    return {
      seal: sealInstance,
      context: sealContext,
      encoder: sealBatchEncoder,
      encryptor: sealEncryptor,
      decryptor: sealDecryptor,
      evaluator: sealEvaluator,
      publicKey: sealPublicKey,
      secretKey: sealSecretKey,
    };
  }

  if (initPromise) {
    await initPromise;
    return {
      seal: sealInstance,
      context: sealContext,
      encoder: sealBatchEncoder,
      encryptor: sealEncryptor,
      decryptor: sealDecryptor,
      evaluator: sealEvaluator,
      publicKey: sealPublicKey,
      secretKey: sealSecretKey,
    };
  }

  initPromise = (async () => {
    try {
      const SEAL = (await import('node-seal')).default;
      sealInstance = await SEAL();

      // 1. Configure BFV Scheme Parameters
      const schemeType = sealInstance.SchemeType.bfv;
      const securityLevel = sealInstance.SecLevelType.tc128;
      const polyModulusDegree = 4096;
      const bitSizes = Int32Array.from([36, 36, 37]);
      const bitSize = 20;

      const parms = new sealInstance.EncryptionParameters(schemeType);
      parms.setPolyModulusDegree(polyModulusDegree);
      parms.setCoeffModulus(sealInstance.CoeffModulus.Create(polyModulusDegree, bitSizes));
      parms.setPlainModulus(sealInstance.PlainModulus.Batching(polyModulusDegree, bitSize));

      // 2. Instantiate Verified Context
      sealContext = new sealInstance.SEALContext(parms, true, securityLevel);
      if (!sealContext.parametersSet()) {
        throw new Error('Failed to configure SEAL BFV Encryption Context: Invalid Parameters');
      }

      // 3. Generate Cryptographic Key Pair
      sealKeyGenerator = new sealInstance.KeyGenerator(sealContext);
      sealSecretKey = sealKeyGenerator.secretKey();
      sealPublicKey = sealKeyGenerator.createPublicKey();

      // 4. Initialize Core Operators
      sealBatchEncoder = new sealInstance.BatchEncoder(sealContext);
      sealEncryptor = new sealInstance.Encryptor(sealContext, sealPublicKey);
      sealDecryptor = new sealInstance.Decryptor(sealContext, sealSecretKey);
      sealEvaluator = new sealInstance.Evaluator(sealContext);

      isInitialized = true;
    } catch (err) {
      console.error('Failed to initialize Microsoft SEAL WASM runtime:', err);
      throw err;
    }
  })();

  await initPromise;
  return {
    seal: sealInstance,
    context: sealContext,
    encoder: sealBatchEncoder,
    encryptor: sealEncryptor,
    decryptor: sealDecryptor,
    evaluator: sealEvaluator,
    publicKey: sealPublicKey,
    secretKey: sealSecretKey,
  };
}

/**
 * Encrypts an integer academic score (e.g. CA 0-30 or Exam 0-70) into a BFV Ciphertext.
 * Returns Base64-encoded serialized ciphertext string and operation metrics.
 */
export async function encryptAcademicScore(score: number): Promise<SealOperationResult> {
  const start = performance.now();
  const { seal, encoder, encryptor, decryptor } = await getSealEngine();

  // Clamp & round score to integer representation
  const validScore = Math.max(0, Math.round(score));

  // Encode into SIMD plaintext slot vector using BigInt64Array for node-seal v7
  const plainText = new seal.Plaintext();
  const slotCount = encoder.slotCount();
  const array = new BigInt64Array(slotCount);
  array[0] = BigInt(validScore);
  encoder.encode(array, plainText);

  // Encrypt Plaintext -> Ciphertext
  const cipherText = new seal.Ciphertext();
  encryptor.encrypt(plainText, cipherText);

  // Measure invariant noise budget (in bits)
  let noiseBudget: number | undefined;
  try {
    noiseBudget = decryptor.invariantNoiseBudget(cipherText);
  } catch {
    noiseBudget = undefined;
  }

  // Serialize to Base64 using zstd compression mode
  const base64Cipher = cipherText.saveToBase64(seal.ComprModeType.zstd);
  const durationMs = performance.now() - start;

  // Clean memory
  plainText.delete();
  cipherText.delete();

  return {
    ciphertext: base64Cipher,
    noiseBudgetBits: noiseBudget,
    durationMs: Number(durationMs.toFixed(2)),
  };
}

/**
 * Performs Homomorphic Addition over two ciphertexts:
 * E(Total) = Evaluator.add(E(CA), E(Exam))
 * NEVER exposes plaintext values during the addition.
 */
export async function homomorphicAddScores(
  cipherABase64: string,
  cipherBBase64: string
): Promise<SealOperationResult> {
  const start = performance.now();
  const { seal, context, evaluator, decryptor } = await getSealEngine();

  // Load ciphertexts
  const cipherA = new seal.Ciphertext();
  cipherA.loadFromBase64(context, cipherABase64);

  const cipherB = new seal.Ciphertext();
  cipherB.loadFromBase64(context, cipherBBase64);

  // Perform Homomorphic Addition on encrypted values
  const resultCipher = new seal.Ciphertext();
  evaluator.add(cipherA, cipherB, resultCipher);

  let noiseBudget: number | undefined;
  try {
    noiseBudget = decryptor.invariantNoiseBudget(resultCipher);
  } catch {
    noiseBudget = undefined;
  }

  const base64Result = resultCipher.saveToBase64(seal.ComprModeType.zstd);
  const durationMs = performance.now() - start;

  // Cleanup
  cipherA.delete();
  cipherB.delete();
  resultCipher.delete();

  return {
    ciphertext: base64Result,
    noiseBudgetBits: noiseBudget,
    durationMs: Number(durationMs.toFixed(2)),
  };
}

/**
 * Performs Homomorphic Summation over an array of ciphertexts (e.g. calculating class aggregate)
 * without decrypting individual student scores.
 */
export async function homomorphicSumScores(
  ciphertextsBase64: string[]
): Promise<HomomorphicSumResult> {
  const start = performance.now();
  if (!ciphertextsBase64 || ciphertextsBase64.length === 0) {
    throw new Error('Cannot perform homomorphic sum on empty ciphertext list');
  }

  const { seal, context, evaluator, decryptor } = await getSealEngine();

  const accumulator = new seal.Ciphertext();
  accumulator.loadFromBase64(context, ciphertextsBase64[0]);

  for (let i = 1; i < ciphertextsBase64.length; i++) {
    const currentCipher = new seal.Ciphertext();
    currentCipher.loadFromBase64(context, ciphertextsBase64[i]);
    evaluator.add(accumulator, currentCipher, accumulator);
    currentCipher.delete();
  }

  let noiseBudget: number | undefined;
  try {
    noiseBudget = decryptor.invariantNoiseBudget(accumulator);
  } catch {
    noiseBudget = undefined;
  }

  const resultBase64 = accumulator.saveToBase64(seal.ComprModeType.zstd);
  const durationMs = performance.now() - start;

  accumulator.delete();

  return {
    resultCiphertext: resultBase64,
    noiseBudgetBits: noiseBudget,
    durationMs: Number(durationMs.toFixed(2)),
    itemCount: ciphertextsBase64.length,
  };
}

/**
 * Authorized Decryption:
 * Decrypts a BFV Ciphertext using the institutional Secret Key.
 * Accessible strictly by authorized backend processes for verified result generation.
 */
export async function decryptAcademicScore(ciphertextBase64: string): Promise<{ value: number; durationMs: number }> {
  const start = performance.now();
  const { seal, context, encoder, decryptor } = await getSealEngine();

  const cipher = new seal.Ciphertext();
  cipher.loadFromBase64(context, ciphertextBase64);

  const plainText = new seal.Plaintext();
  decryptor.decrypt(cipher, plainText);

  const decodedSlots = encoder.decodeBigInt64(plainText);
  const value = Number(decodedSlots[0]);

  const durationMs = performance.now() - start;

  cipher.delete();
  plainText.delete();

  return {
    value,
    durationMs: Number(durationMs.toFixed(2)),
  };
}

/**
 * Determines Standard Nigerian University Tertiary Grading scale
 */
export function calculateAcademicGrade(totalScore: number): { grade: string; gradePoint: number } {
  if (totalScore >= 70) return { grade: 'A', gradePoint: 5.0 };
  if (totalScore >= 60) return { grade: 'B', gradePoint: 4.0 };
  if (totalScore >= 50) return { grade: 'C', gradePoint: 3.0 };
  if (totalScore >= 45) return { grade: 'D', gradePoint: 2.0 };
  if (totalScore >= 40) return { grade: 'E', gradePoint: 1.0 };
  return { grade: 'F', gradePoint: 0.0 };
}

