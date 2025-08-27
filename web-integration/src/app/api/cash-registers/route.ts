import { NextRequest, NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};
    if (status) filters.status = status;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const cashRegisters = await auxiliadoraApiClient.getCashRegisters(filters);
    return NextResponse.json(cashRegisters);
  } catch (error) {
    console.error('Error fetching cash registers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash registers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cashRegister = await auxiliadoraApiClient.createCashRegister(body);
    return NextResponse.json(cashRegister, { status: 201 });
  } catch (error) {
    console.error('Error creating cash register:', error);
    return NextResponse.json(
      { error: 'Failed to create cash register' },
      { status: 500 }
    );
  }
}