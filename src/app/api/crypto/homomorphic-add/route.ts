import { NextRequest, NextResponse } from 'next/server';
import { homomorphicAddScores } from '@/lib/crypto/seal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cipherA, cipherB } = body;

    if (!cipherA || !cipherB) {
      return NextResponse.json(
        { error: 'Both cipherA and cipherB base64 payloads are required' },
        { status: 400 }
      );
    }

    const homomorphicResult = await homomorphicAddScores(cipherA, cipherB);
    return NextResponse.json({ success: true, ...homomorphicResult });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Homomorphic addition failed' },
      { status: 500 }
    );
  }
}
