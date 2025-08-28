'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Target, Zap, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RevenueData {
  period: string;
  revenue: number;
  growth: number;
}

interface ModernRevenueChartProps {
  data: RevenueData[];
}

function AnimatedCircle({ value, maxValue, label, growth, color, delay }: {
  value: number;
  maxValue: number;
  label: string;
  growth: number;
  color: string;
  delay: number;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = (value / maxValue) * 100;
  const circumference = 2 * Math.PI * 35; // raio reduzido para 35
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(percentage);
    }, delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  const isPositiveGrowth = growth >= 0;

  return (
    <div className="flex flex-col items-center space-y-2 flex-1 max-w-[120px]">
      <div className="relative">
        <svg className="w-20 sm:w-24 lg:w-28 h-20 sm:h-24 lg:h-28 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r="35"
            stroke="#e2e8f0"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r="35"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out drop-shadow-lg"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-1 sm:p-2">
            <div className="text-sm sm:text-base lg:text-lg font-bold text-slate-800">
              {Math.round(animatedValue)}%
            </div>
            <div className="text-xs text-slate-600">
              R$ {(value / 1000).toFixed(0)}k
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center space-y-1">
        <div className="text-xs sm:text-sm font-medium text-slate-600 text-center">{label}</div>
        <div className="flex items-center justify-center space-x-1">
          <div 
            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" 
            style={{ backgroundColor: color }}
          />
          <span className={cn(
            "text-xs",
            isPositiveGrowth ? "text-emerald-600" : "text-rose-600"
          )}>
            {isPositiveGrowth ? '+' : ''}{growth.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend: number;
}) {
  const isPositive = trend >= 0;
  
  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className={cn(
              "p-3 rounded-2xl w-fit transition-all duration-500 shadow-lg",
              "group-hover:scale-110 group-hover:rotate-3",
              isPositive 
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-200 dark:shadow-emerald-900/50" 
                : "bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-indigo-200 dark:shadow-indigo-900/50"
            )}>
              <Icon className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 tracking-wide uppercase">{title}</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">{value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm">
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
                {isPositive ? '+' : ''}{trend.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ModernRevenueChart({ data }: ModernRevenueChartProps) {
  // Dados de exemplo se não fornecidos
  const defaultData: RevenueData[] = [
    { period: 'Jan', revenue: 15000, growth: 12.5 },
    { period: 'Fev', revenue: 18000, growth: 20.0 },
    { period: 'Mar', revenue: 16500, growth: -8.3 },
    { period: 'Abr', revenue: 22000, growth: 33.3 },
    { period: 'Mai', revenue: 25000, growth: 13.6 },
    { period: 'Jun', revenue: 28000, growth: 12.0 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;
  const maxRevenue = Math.max(...chartData.map(d => d.revenue));
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const avgGrowth = chartData.reduce((sum, d) => sum + d.growth, 0) / chartData.length;
  const bestMonth = chartData.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current);
  
  const colors = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  return (
    <div className="w-full h-full space-y-6 flex flex-col">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Receita Total"
          value={`R$ ${(totalRevenue / 1000).toFixed(0)}k`}
          subtitle="Últimos 6 meses"
          icon={DollarSign}
          trend={avgGrowth}
        />
        <MetricCard
          title="Melhor Mês"
          value={`R$ ${(bestMonth.revenue / 1000).toFixed(0)}k`}
          subtitle={bestMonth.period}
          icon={Target}
          trend={bestMonth.growth}
        />
        <MetricCard
          title="Crescimento Médio"
          value={`${avgGrowth.toFixed(1)}%`}
          subtitle="Por período"
          icon={Zap}
          trend={avgGrowth}
        />
      </div>

      {/* Gráfico principal */}
      <Card className="flex-1 overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Evolução da Receita
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Análise de performance e crescimento por período
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg px-4 py-2 text-sm font-semibold">
              <Calendar className="h-4 w-4 mr-2" />
              6 meses
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center min-h-[280px]">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 lg:gap-6 p-2 sm:p-4 lg:p-6 max-w-full">
              {chartData.map((item, index) => (
                <AnimatedCircle
                  key={item.period}
                  value={item.revenue}
                  maxValue={maxRevenue}
                  label={item.period}
                  growth={item.growth}
                  color={colors[index % colors.length]}
                  delay={index * 200}
                />
              ))}
            </div>
          </div>
          
          {/* Insights */}
          <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase">Tendência Geral</h4>
                <div className="flex items-center space-x-3">
                  <Progress value={Math.abs(avgGrowth) * 2} className="flex-1 h-2" />
                  <span className={cn(
                    "text-sm font-bold px-3 py-1 rounded-full",
                    avgGrowth >= 0 
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30" 
                      : "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30"
                  )}>
                    {avgGrowth >= 0 ? 'Crescimento' : 'Declínio'}
                  </span>
                </div>
              </div>
              <div className="space-y-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase">Performance</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-sm" />
                    <span>Meta: R$ 20k/mês</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm px-3 py-1 text-sm font-semibold">
                    {chartData.filter(d => d.revenue >= 20000).length}/{chartData.length}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}