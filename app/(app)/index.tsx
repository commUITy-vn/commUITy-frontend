import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { SummaryRequestCard } from '@/features/support/components/SummaryRequestCard';
import { useSupportRequests } from '@/features/support/hooks/useSupportRequests';
import { SupportRequestSummaryResponse } from '@/features/support/api/get-support-requests';

export default function HomeScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();

  // Filter state
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const handleRequestPress = (request: SupportRequestSummaryResponse) => {
    router.push(`/(app)/request/${request.id}`);
  };

  // Fetch support requests using the hook
  const { data: requests, isLoading, isError } = useSupportRequests();

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      {/* Filter Bar - anchored with background and border */}
      <View style={[
        localStyles.filterHeader,
        {
          backgroundColor: theme.appBG,
          borderBottomColor: theme.border,
        }
      ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.filterScroll}
        >
          {['Category', 'Location (Radius)', 'Urgency'].map((filter) => {
            const isActive = activeFilters.includes(filter);
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => toggleFilter(filter)}
                style={[
                  filterStyles.pill,
                  {
                    backgroundColor: isActive ? theme.primary : theme.highlightBG,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    filterStyles.pillText,
                    {
                      color: isActive ? theme.textLight : theme.textSupporting,
                    },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Feed */}
      {isLoading ? (
        <View style={styles.container}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : isError ? (
        <View style={styles.container}>
          <Text style={{ textAlign: 'center', marginTop: 50, color: theme.textSupporting }}>
            Failed to load community requests.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SummaryRequestCard request={item} onPress={handleRequestPress} />
          )}
          contentContainerStyle={localStyles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB - perfectly centered matching Expensify reference */}
      <Pressable
        onPress={() => router.push('/(app)/create-request')}
        style={[
          localStyles.fab,
          { backgroundColor: theme.primary },
        ]}
      >
        <Text style={[localStyles.fabIcon, { color: theme.textLight }]}>+</Text>
      </Pressable>
    </View>
  );
}

/* ---------- Static Styles ---------- */

const filterStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

const localStyles = StyleSheet.create({
  filterHeader: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 999,
  },
  fabIcon: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300',
  },
});