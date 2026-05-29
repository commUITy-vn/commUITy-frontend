import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { Button } from '@/components/ui';
import { useMyDonations } from '@/features/finance/hooks/useCommunityFunds';

export default function TransactionHistoryScreen() {
  const theme = useTheme();
  const stylesGlobal = useThemeStyles();
  const router = useRouter();

  const { data: donations, isLoading, isError } = useMyDonations();

  // Compute total balance and transaction details
  const stats = useMemo(() => {
    if (!donations || !Array.isArray(donations)) {
      return { totalAmount: 0, count: 0 };
    }
    const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    return {
      totalAmount,
      count: donations.length,
    };
  }, [donations]);

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleNavigateToFunds = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(app)');
  };

  if (isLoading) {
    return (
      <View style={[stylesGlobal.container, styles.center, { backgroundColor: theme.appBG }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[stylesGlobal.container, styles.center, { backgroundColor: theme.appBG }]}>
        <MaterialIcons name="error-outline" size={48} color={theme.danger} />
        <Text style={[styles.errorText, { color: theme.text, marginTop: 12 }]}>
          Failed to load transaction history
        </Text>
        <Button
          text="Go Back"
          onPress={handleBack}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        stylesGlobal.container,
        {
          backgroundColor: theme.appBG,
          height: (Platform.OS === 'web' ? '100vh' : '100%') as any,
        },
      ]}
    >
      {/* Premium Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { backgroundColor: theme.highlightBG },
          ]}
        >
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction History</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Glassmorphic Stats Header */}
        <View style={[styles.statsCard, { backgroundColor: theme.primary }]}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsLabel}>Total Given</Text>
            <MaterialIcons name="volunteer-activism" size={22} color="#FFF" />
          </View>
          <Text style={styles.statsValue}>
            ₫ {stats.totalAmount.toLocaleString()}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.statsBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Text style={styles.statsBadgeText}>{stats.count} Contributions</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Contribution Ledger</Text>

        {donations && donations.length > 0 ? (
          <View style={styles.ledgerList}>
            {donations.map((tx) => (
              <View
                key={tx.id}
                style={[
                  styles.txItem,
                  { backgroundColor: theme.componentBG, borderColor: theme.border },
                ]}
              >
                <View style={styles.txHeader}>
                  <View style={[styles.txIconContainer, { backgroundColor: theme.success + '15' }]}>
                    <Ionicons name="arrow-down-circle" size={24} color={theme.success} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.txFundName, { color: theme.text }]} numberOfLines={1}>
                      Donation to {tx.fundName || 'Community Fund'}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textSupporting }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: theme.success }]}>
                    +₫{tx.amount.toLocaleString()}
                  </Text>
                </View>

                {(tx.note || tx.transactionCode || tx.paymentMethod) && (
                  <View style={[styles.txDetails, { borderTopColor: theme.border }]}>
                    {tx.note && (
                      <Text style={[styles.txNote, { color: theme.textSupporting }]}>
                        {"\""}{tx.note}{"\""}
                      </Text>
                    )}
                    <View style={styles.metaRow}>
                      {tx.paymentMethod && (
                        <View style={[styles.metaPill, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}>
                          <Text style={[styles.metaPillText, { color: theme.textSupporting }]}>
                            {tx.paymentMethod}
                          </Text>
                        </View>
                      )}
                      {tx.transactionCode && (
                        <Text style={[styles.txCode, { color: theme.textSupporting }]} numberOfLines={1}>
                          Code: {tx.transactionCode}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          /* Empty State */
          <View style={[styles.emptyContainer, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.highlightBG }]}>
              <MaterialIcons name="history" size={40} color={theme.textSupporting} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Transactions Yet</Text>
            <Text style={[styles.emptySub, { color: theme.textSupporting }]}>
              Support local community initiatives to see your transaction history here.
            </Text>
            <Button
              text="Explore Community Funds"
              primary
              onPress={handleNavigateToFunds}
              style={{ width: '100%', marginTop: 8 }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  statsCard: {
    borderRadius: 16,
    padding: 24,
    gap: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statsBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statsBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  ledgerList: {
    gap: 12,
  },
  txItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txFundName: {
    fontSize: 15,
    fontWeight: '700',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  txDetails: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 8,
  },
  txNote: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metaPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  txCode: {
    fontSize: 11,
    fontStyle: 'normal',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 12,
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
});
