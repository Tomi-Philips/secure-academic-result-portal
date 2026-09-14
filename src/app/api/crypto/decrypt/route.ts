import { NextRequest, NextResponse } from 'next/server';
import { decryptAcademicScore } from '@/lib/crypto/seal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ciphertext } = body;

    if (!ciphertext) {
      return NextResponse.json(
        { error: 'Ciphertext is required for decryption' },
        { status: 400 }
      );
    }

    const decryptionResult = await decryptAcademicScore(ciphertext);
    return NextResponse.json({ success: true, ...decryptionResult });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Decryption failed' },
      { status: 500 }
    );
  }
}
