'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState, useCallback, useEffect } from 'react';
import { dashboardService } from '@/lib/dashboard-service';
import type { DashboardData, DashboardMetrics, ActivityItem } from '@/lib/dashboard-service';

interface UseDashboardDataOptions {
  refetchInterval?: number;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

interface DashboardDataState {
  data: DashboardData | undefined;
  metrics: DashboardMetrics | undefined;
  activities: ActivityItem[] | undefined;
  systemHealth: any;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isRefetching: boolean;
  lastUpdated: Date | null;
}

interface DashboardDataActions {
  refetch: () => Promise<void>;
  refetchMetrics: () => Promise<void>;
  refetchActivities: () => Promise<void>;
  refetchSystemHealth: () => Promise<void>;
  clearCache: () => void;
  retry: () => void;
}

export function useDashboardData(options: UseDashboardDataOptions = {}): DashboardDataState & DashboardDataActions {
  const {
    refetchInterval = 30000, // 30 seconds
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Debug: Log hook state changes
  useEffect(() => {
    console.log('🔍 useDashboardData hook state:', {
      enabled,
      refetchInterval,
      staleTime,
      cacheTime
    });
  }, [enabled, refetchInterval, staleTime, cacheTime]);

  // Main dashboard data query
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
    isRefetching: isDashboardRefetching,
  } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      console.log('🔄 useDashboardData: Executing dashboard query...');
      try {
        const data = await dashboardService.getDashboardData();
        console.log('✅ useDashboardData: Dashboard data received:', data);
        setLastUpdated(new Date());
        return data;
      } catch (error) {
        console.error('❌ useDashboardData: Dashboard query failed:', error);
        throw error;
      }
    },
    refetchInterval,
    enabled,
    staleTime,
    cacheTime,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3) {
        const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
        return isNetworkError;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Metrics query
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
    error: metricsError,
    refetch: refetchMetricsQuery,
    isRefetching: isMetricsRefetching,
  } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => dashboardService.getMetrics(),
    refetchInterval,
    enabled,
    staleTime,
    cacheTime,
  });

  // Activities query
  const {
    data: activities,
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
    error: activitiesError,
    refetch: refetchActivitiesQuery,
    isRefetching: isActivitiesRefetching,
  } = useQuery({
    queryKey: ['dashboard-activities'],
    queryFn: () => dashboardService.getRecentActivities(),
    refetchInterval,
    enabled,
    staleTime,
    cacheTime,
  });

  // System health query
  const {
    data: systemHealth,
    isLoading: isSystemHealthLoading,
    isError: isSystemHealthError,
    error: systemHealthError,
    refetch: refetchSystemHealthQuery,
    isRefetching: isSystemHealthRefetching,
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => dashboardService.getSystemStats(),
    refetchInterval: refetchInterval / 2, // Check system health more frequently
    enabled,
    staleTime: staleTime / 2,
    cacheTime,
  });

  // Combined loading state
  const isLoading = isDashboardLoading || isMetricsLoading || isActivitiesLoading || isSystemHealthLoading;
  
  // Combined error state
  const isError = isDashboardError || isMetricsError || isActivitiesError || isSystemHealthError;
  const error = dashboardError || metricsError || activitiesError || systemHealthError;
  
  // Combined refetching state
  const isRefetching = isDashboardRefetching || isMetricsRefetching || isActivitiesRefetching || isSystemHealthRefetching;

  // Action handlers
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchDashboard(),
      refetchMetricsQuery(),
      refetchActivitiesQuery(),
      refetchSystemHealthQuery(),
    ]);
  }, [refetchDashboard, refetchMetricsQuery, refetchActivitiesQuery, refetchSystemHealthQuery]);

  const refetchMetrics = useCallback(async () => {
    await refetchMetricsQuery();
  }, [refetchMetricsQuery]);

  const refetchActivities = useCallback(async () => {
    await refetchActivitiesQuery();
  }, [refetchActivitiesQuery]);

  const refetchSystemHealth = useCallback(async () => {
    await refetchSystemHealthQuery();
  }, [refetchSystemHealthQuery]);

  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['dashboard-data'] });
    queryClient.removeQueries({ queryKey: ['dashboard-metrics'] });
    queryClient.removeQueries({ queryKey: ['dashboard-activities'] });
    queryClient.removeQueries({ queryKey: ['system-health'] });
    dashboardService.clearCache();
  }, [queryClient]);

  const retry = useCallback(() => {
    if (isDashboardError) refetchDashboard();
    if (isMetricsError) refetchMetricsQuery();
    if (isActivitiesError) refetchActivitiesQuery();
    if (isSystemHealthError) refetchSystemHealthQuery();
  }, [
    isDashboardError,
    isMetricsError,
    isActivitiesError,
    isSystemHealthError,
    refetchDashboard,
    refetchMetricsQuery,
    refetchActivitiesQuery,
    refetchSystemHealthQuery,
  ]);

  return {
    // Data
    data: dashboardData,
    metrics,
    activities,
    systemHealth,
    
    // States
    isLoading,
    isError,
    error,
    isRefetching,
    lastUpdated,
    
    // Actions
    refetch,
    refetchMetrics,
    refetchActivities,
    refetchSystemHealth,
    clearCache,
    retry,
  };
}

// Hook for handling connection status
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    lastOnline,
    isOffline: !isOnline,
  };
}

// Hook for API health monitoring
export function useAPIHealth() {
  const { data: health, isLoading, error } = useQuery({
    queryKey: ['api-health'],
    queryFn: () => dashboardService.checkHealth(),
    refetchInterval: 60000, // Check every minute
    retry: false, // Don't retry health checks
  });

  return {
    isHealthy: health?.status === 'healthy',
    responseTime: health?.responseTime || 0,
    isLoading,
    error,
  };
}

export type {
  UseDashboardDataOptions,
  DashboardDataState,
  DashboardDataActions,
};