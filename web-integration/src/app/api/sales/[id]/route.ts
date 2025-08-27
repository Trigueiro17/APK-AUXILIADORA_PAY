import { NextRequest, NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await auxiliadoraApiClient.getSaleById(params.id);
    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
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
    const sale = await auxiliadoraApiClient.updateSale(params.id, body);
    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { error: 'Failed to update sale' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await auxiliadoraApiClient.deleteSale(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      { error: 'Failed to delete sale' },
      { status: 500 }
    );
  }
}