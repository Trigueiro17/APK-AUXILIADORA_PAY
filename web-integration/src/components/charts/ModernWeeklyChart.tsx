'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, TrendingDown, Activity, Clock, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklyData {
  day: string;
  value: number;
  transactions: number;
  peak_hour: string;
}

interface ModernWeeklyChartProps {
  data: WeeklyData[];
}

function AnimatedBar({ value, maxValue, day, transactions, peakHour, color, delay }: {
  value: number;
  maxValue: number;
  day: string;
  transactions: number;
  peakHour: string;
  color: string;
  delay: number;
}) {
  const [animatedHeight, setAnimatedHeight] = useState(0);
  const percentage = (value / maxValue) * 100;
  const barHeight = Math.max(percentage, 5); // Altura mínima de 5%

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedHeight(barHeight);
    }, delay);
    return () => clearTimeout(timer);
  }, [barHeight, delay]);

  return (
    <div className="flex flex-col items-center space-y-1 sm:space-y-2 group cursor-pointer flex-1 max-w-[60px]">
      <div className="relative flex flex-col items-center justify-end h-32 sm:h-40 lg:h-48 w-full max-w-[40px] mx-auto">
        {/* Barra animada */}
        <div
          className="w-full rounded-t-2xl transition-all duration-1000 ease-out group-hover:scale-105 relative overflow-hidden shadow-lg"
          style={{
            height: `${animatedHeight}%`,
            background: `linear-gradient(to top, ${color}, ${color}90, ${color}60)`,
            boxShadow: `0 8px 32px ${color}30, 0 0 0 1px ${color}20`,
          }}
        >
          {/* Efeito de brilho */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Reflexo lateral */}
          <div className="absolute left-0 top-0 w-1 h-full bg-white/40 opacity-60" />
        </div>
        
        {/* Valor no topo */}
        <div className="absolute -top-8 sm:-top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
          <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl shadow-xl whitespace-nowrap font-bold backdrop-blur-sm">
            R$ {(value / 1000).toFixed(1)}k
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
          </div>
        </div>
      </div>
      
      {/* Informações do dia */}
      <div className="text-center space-y-1 sm:space-y-1.5">
        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-wide">{day}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium hidden sm:block">{transactions} transações</div>
        <div className="text-xs text-slate-500 dark:text-slate-500 flex items-center justify-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-full px-1 sm:px-2 py-0.5 sm:py-1">
          <Clock className="h-3 w-3" />
          <span className="font-medium">{peakHour}</span>
        </div>
      </div>
    </div>
  );
}

function WeeklyInsight({ title, value, subtitle, icon: Icon, trend, color }: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: number;
  color: string;
}) {
  return (
    <div className="flex items-center space-x-4 p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm">
      <div className={`p-3 rounded-2xl shadow-lg`} style={{ backgroundColor: `${color}15`, border: `2px solid ${color}30` }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">{title}</p>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100">{value}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{subtitle}</p>
          </div>
          {trend !== undefined && (
            <div className="flex items-center space-x-2 bg-white/60 dark:bg-slate-800/60 rounded-xl px-3 py-2 shadow-sm">
              {trend >= 0 ? (
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-rose-500" />
              )}
              <span className={cn(
                "text-sm font-bold",
                trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ModernWeeklyChart({ data }: ModernWeeklyChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('Esta Semana');
  
  // Dados de exemplo se não fornecidos
  const defaultData: WeeklyData[] = [
    { day: 'Seg', value: 12000, transactions: 45, peak_hour: '14:30' },
    { day: 'Ter', value: 15000, transactions: 52, peak_hour: '16:15' },
    { day: 'Qua', value: 18000, transactions: 61, peak_hour: '15:45' },
    { day: 'Qui', value: 14000, transactions: 48, peak_hour: '17:20' },
    { day: 'Sex', value: 22000, transactions: 78, peak_hour: '18:00' },
    { day: 'Sáb', value: 8000, transactions: 28, peak_hour: '12:30' },
    { day: 'Dom', value: 6000, transactions: 19, peak_hour: '11:15' },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;
  const maxValue = Math.max(...chartData.map(d => d.value));
  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0);
  const totalTransactions = chartData.reduce((sum, d) => sum + d.transactions, 0);
  const avgValue = totalValue / chartData.length;
  const bestDay = chartData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
  const weekGrowth = ((chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value) * 100;
  
  const colors = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16'
  ];

  return (
    <div className="w-full h-full space-y-6 flex flex-col">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h3 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Performance Semanal
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Análise detalhada de vendas e transações por dia
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedPeriod === 'Esta Semana' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('Esta Semana')}
            className="text-xs"
          >
            Esta Semana
          </Button>
          <Button
            variant={selectedPeriod === 'Semana Passada' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('Semana Passada')}
            className="text-xs"
          >
            Semana Passada
          </Button>
        </div>
      </div>

      {/* Insights rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WeeklyInsight
          title="Melhor Dia"
          value={`R$ ${(bestDay.value / 1000).toFixed(1)}k`}
          subtitle={`${bestDay.day} - ${bestDay.transactions} transações`}
          icon={TrendingUp}
          trend={weekGrowth}
          color="#10b981"
        />
        <WeeklyInsight
          title="Média Diária"
          value={`R$ ${(avgValue / 1000).toFixed(1)}k`}
          subtitle={`${(totalTransactions / 7).toFixed(0)} transações/dia`}
          icon={BarChart3}
          color="#6366f1"
        />
        <WeeklyInsight
          title="Total da Semana"
          value={`R$ ${(totalValue / 1000).toFixed(0)}k`}
          subtitle={`${totalTransactions} transações`}
          icon={Activity}
          trend={weekGrowth}
          color="#8b5cf6"
        />
      </div>

      {/* Gráfico principal */}
      <Card className="flex-1 overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {selectedPeriod}
              </CardTitle>
            </div>
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg px-4 py-2 text-sm font-semibold">
              7 dias
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 flex items-end justify-between space-x-1 sm:space-x-2 lg:space-x-3 px-2 sm:px-4 py-4 sm:py-6 lg:py-8 min-h-[280px]">
            {chartData.map((item, index) => (
              <AnimatedBar
                key={item.day}
                value={item.value}
                maxValue={maxValue}
                day={item.day}
                transactions={item.transactions}
                peakHour={item.peak_hour}
                color={colors[index % colors.length]}
                delay={index * 150}
              />
            ))}
          </div>
          
          {/* Linha de base */}
          <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 font-medium">
              <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Linha de base: R$ {(avgValue / 1000).toFixed(1)}k</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Pico: {bestDay.day} às {bestDay.peak_hour}</span>
            </div>
          </div>
          
          {/* Análise de tendência */}
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase">Análise de Tendência</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {weekGrowth >= 0 ? 'Crescimento' : 'Declínio'} de {Math.abs(weekGrowth).toFixed(1)}% durante a semana
                </p>
              </div>
              <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-800/60 rounded-xl px-4 py-3 shadow-sm">
                {weekGrowth >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-rose-500" />
                )}
                <span className={cn(
                  "text-lg font-black",
                  weekGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {weekGrowth >= 0 ? '+' : ''}{weekGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}