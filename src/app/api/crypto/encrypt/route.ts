import { NextRequest, NextResponse } from 'next/server';
import { encryptAcademicScore } from '@/lib/crypto/seal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { score } = body;

    if (typeof score !== 'number' || score < 0 || score > 100) {
      return NextResponse.json(
        { error: 'Valid score between 0 and 100 is required' },
        { status: 400 }
      );
    }

    const encryptionResult = await encryptAcademicScore(score);
    return NextResponse.json({ success: true, ...encryptionResult });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Encryption failed' },
      { status: 500 }
    );
  }
}
