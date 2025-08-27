import { NextRequest, NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cashRegister = await auxiliadoraApiClient.getCashRegisterById(params.id);
    return NextResponse.json(cashRegister);
  } catch (error) {
    console.error('Error fetching cash register:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash register' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const cashRegister = await auxiliadoraApiClient.updateCashRegister(params.id, body);
    return NextResponse.json(cashRegister);
  } catch (error) {
    console.error('Error updating cash register:', error);
    return NextResponse.json(
      { error: 'Failed to update cash register' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await auxiliadoraApiClient.deleteCashRegister(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cash register:', error);
    return NextResponse.json(
      { error: 'Failed to delete cash register' },
      { status: 500 }
    );
  }
}