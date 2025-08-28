'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesData {
  day: string;
  sales: number;
  revenue: number;
}

interface ModernSalesChartProps {
  data: SalesData[];
}

function AnimatedBar({ value, maxValue, label, color, delay }: {
  value: number;
  maxValue: number;
  label: string;
  color: string;
  delay: number;
}) {
  const [animatedHeight, setAnimatedHeight] = useState(0);
  const percentage = (value / maxValue) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedHeight(percentage);
    }, delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="flex flex-col items-center space-y-1 sm:space-y-2 flex-1 max-w-[60px] group">
      <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 text-center">
        {value}
      </div>
      <div className="relative h-32 sm:h-40 lg:h-48 w-full max-w-[40px] mx-auto bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <div 
          className={cn(
            "absolute bottom-0 w-full rounded-2xl transition-all duration-1200 ease-out",
            "group-hover:shadow-2xl group-hover:scale-105 transform"
          )}
          style={{
            height: `${Math.max(animatedHeight, 5)}%`,
            background: `linear-gradient(135deg, ${color}, ${color}cc, ${color}88)`,
            boxShadow: `0 8px 32px ${color}30, inset 0 1px 0 rgba(255,255,255,0.2)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 pointer-events-none rounded-2xl" />
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-white/20 rounded-full" />
      </div>
      <div className="text-center space-y-1">
        <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 text-center break-words">{label}</div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon }: {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
}) {
  const isPositive = change >= 0;
  
  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-lg backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 tracking-wide uppercase">{title}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">{value}</p>
          </div>
          <div className={cn(
            "p-4 rounded-2xl transition-all duration-500 shadow-lg",
            "group-hover:scale-110 group-hover:rotate-3",
            isPositive 
              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-200 dark:shadow-emerald-900/50" 
              : "bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-200 dark:shadow-rose-900/50"
          )}>
            <Icon className="h-7 w-7 text-white drop-shadow-sm" />
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <div className={cn(
            "p-1 rounded-full",
            isPositive ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"
          )}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            )}
          </div>
          <span className={cn(
            "text-sm font-bold",
            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}>
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">vs. período anterior</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ModernSalesChart({ data }: ModernSalesChartProps) {
  // Dados de exemplo se não houver dados
  const defaultData: SalesData[] = [
    { day: 'Seg', sales: 45, revenue: 2250 },
    { day: 'Ter', sales: 52, revenue: 2600 },
    { day: 'Qua', sales: 38, revenue: 1900 },
    { day: 'Qui', sales: 61, revenue: 3050 },
    { day: 'Sex', sales: 73, revenue: 3650 },
    { day: 'Sáb', sales: 89, revenue: 4450 },
    { day: 'Dom', sales: 67, revenue: 3350 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;
  const maxSales = Math.max(...chartData.map(d => d.sales));
  const totalSales = chartData.reduce((sum, d) => sum + d.sales, 0);
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const avgSales = totalSales / chartData.length;
  
  // Calcular mudança percentual (simulada)
  const salesChange = 12.5;
  const revenueChange = 8.3;

  const colors = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  return (
    <div className="w-full h-full space-y-6 flex flex-col">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total de Vendas"
          value={totalSales.toString()}
          change={salesChange}
          icon={BarChart3}
        />
        <StatCard
          title="Receita Total"
          value={`R$ ${(totalRevenue / 1000).toFixed(1)}k`}
          change={revenueChange}
          icon={TrendingUp}
        />
        <StatCard
          title="Meta Diária"
          value={avgSales.toFixed(0)}
          change={5.2}
          icon={Target}
        />
      </div>

      {/* Gráfico principal */}
      <Card className="flex-1 overflow-hidden bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50 border-0 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Vendas por Dia da Semana
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Análise de performance semanal com tendências
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg px-4 py-2 text-sm font-semibold">
              Últimos 7 dias
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 flex items-end justify-between space-x-1 sm:space-x-2 lg:space-x-3 px-2 sm:px-4 min-h-[250px]">
            {chartData.map((item, index) => (
              <AnimatedBar
                key={item.day}
                value={item.sales}
                maxValue={maxSales}
                label={item.day}
                color={colors[index % colors.length]}
                delay={index * 150}
              />
            ))}
          </div>
          
          {/* Legenda */}
          <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-sm" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Vendas Realizadas</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Tendência Positiva</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}