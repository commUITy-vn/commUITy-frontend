import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '@/lib/api-client';
import { useTheme } from '@/hooks/useTheme';

type PayOsResultMode = 'return' | 'cancel';
type ResultState = 'syncing' | 'success' | 'cancelled' | 'error';

interface PaymentReconciliationResponse {
  id: string;
  paymentType: 'COMMUNITY_FUND_DONATION' | 'SUPPORT_NEED_CONTRIBUTION';
  orderCode: number;
  status: string;
  transactionCode?: string;
}

interface PayOsResultScreenProps {
  mode: PayOsResultMode;
}

const firstParam = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export function PayOsResultScreen({ mode }: PayOsResultScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderCode?: string | string[];
    source?: string | string[];
    fundId?: string | string[];
    requestId?: string | string[];
    supportNeedId?: string | string[];
    cancel?: string | string[];
  }>();
  const queryClient = useQueryClient();

  const [state, setState] = useState<ResultState>('syncing');
  const [message, setMessage] = useState('Checking payment status...');
  const [result, setResult] = useState<PaymentReconciliationResponse | null>(null);

  const orderCode = firstParam(params.orderCode);
  const source = firstParam(params.source);
  const fundId = firstParam(params.fundId);
  const requestId = firstParam(params.requestId);
  const supportNeedId = firstParam(params.supportNeedId);
  const isCancelled = mode === 'cancel' || firstParam(params.cancel) === 'true';

  const destination = useMemo(() => {
    if (source === 'communityFund' && fundId) {
      return `/community-funds/${fundId}`;
    }

    if (source === 'supportRequest' && requestId) {
      return `/request/${requestId}`;
    }

    return '/transaction-history';
  }, [fundId, requestId, source]);

  useEffect(() => {
    let isMounted = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const syncPayment = async () => {
      if (!orderCode) {
        setState('error');
        setMessage('Payment order code is missing.');
        return;
      }

      try {
        const endpoint = isCancelled
          ? '/api/v1/payments/payos/cancel'
          : '/api/v1/payments/payos/return';
        const response = await api.get<PaymentReconciliationResponse>(endpoint, {
          params: { orderCode },
        });

        if (!isMounted) {
          return;
        }

        setResult(response);
        setState(isCancelled ? 'cancelled' : 'success');
        setMessage(isCancelled ? 'Payment cancelled.' : 'Payment confirmed.');

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['communityFunds'] }),
          queryClient.invalidateQueries({ queryKey: ['myFunds'] }),
          queryClient.invalidateQueries({ queryKey: ['myDonations'] }),
          queryClient.invalidateQueries({ queryKey: ['mySupportNeedContributions'] }),
          fundId ? queryClient.invalidateQueries({ queryKey: ['communityFund', fundId] }) : Promise.resolve(),
          fundId ? queryClient.invalidateQueries({ queryKey: ['fundDonations', fundId] }) : Promise.resolve(),
          requestId ? queryClient.invalidateQueries({ queryKey: ['supportRequest', requestId] }) : Promise.resolve(),
          supportNeedId
            ? queryClient.invalidateQueries({ queryKey: ['supportNeedContributions', supportNeedId] })
            : Promise.resolve(),
        ]);

        redirectTimer = setTimeout(() => {
          router.replace(destination as any);
        }, 900);
      } catch (error: any) {
        if (!isMounted) {
          return;
        }

        setState('error');
        setMessage(error?.message || 'Could not sync payment status.');
      }
    };

    syncPayment();

    return () => {
      isMounted = false;
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [destination, fundId, isCancelled, orderCode, queryClient, requestId, router, supportNeedId]);

  const iconName =
    state === 'success'
      ? 'check-circle'
      : state === 'cancelled'
        ? 'cancel'
        : state === 'error'
          ? 'error'
          : 'payments';
  const iconColor =
    state === 'success'
      ? theme.success
      : state === 'cancelled' || state === 'error'
        ? theme.danger
        : theme.primary;
  const title =
    state === 'success'
      ? 'Payment complete'
      : state === 'cancelled'
        ? 'Payment cancelled'
        : state === 'error'
          ? 'Payment needs attention'
          : 'Finalizing payment';

  return (
    <View style={[styles.screen, { backgroundColor: theme.appBG }]}>
      <View style={[styles.panel, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
        {state === 'syncing' ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <MaterialIcons name={iconName} size={48} color={iconColor} />
        )}

        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.message, { color: theme.textSupporting }]}>{message}</Text>

        {result?.transactionCode ? (
          <Text style={[styles.transaction, { color: theme.textSupporting }]}>
            {result.transactionCode}
          </Text>
        ) : null}

        <Pressable
          onPress={() => router.replace(destination as any)}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <MaterialIcons name="arrow-forward" size={18} color={theme.textLight} />
          <Text style={[styles.buttonText, { color: theme.textLight }]}>Return</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  transaction: {
    fontSize: 13,
    fontWeight: '700',
  },
  button: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 18,
    gap: 8,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
