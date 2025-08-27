import { NextRequest, NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const cashRegisterId = searchParams.get('cashRegisterId');
    const paymentMethod = searchParams.get('paymentMethod');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};
    if (status) filters.status = status;
    if (userId) filters.userId = userId;
    if (cashRegisterId) filters.cashRegisterId = cashRegisterId;
    if (paymentMethod) filters.paymentMethod = paymentMethod;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const sales = await auxiliadoraApiClient.getSales(filters);
    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sale = await auxiliadoraApiClient.createSale(body);
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}