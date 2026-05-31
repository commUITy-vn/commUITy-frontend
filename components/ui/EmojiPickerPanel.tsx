/**
 * EmojiPickerPanel — ported from Expensify's EmojiPicker system.
 *
 * Structure mirrors Expensify's EmojiPickerMenu + CategoryShortcutBar:
 *   - Search input at the top
 *   - Category shortcut icon bar
 *   - FlashList grid (8 columns, sticky category headers, 700+ emojis)
 *   - Skin tone row at the bottom (future)
 *
 * Differences from Expensify:
 *   - No Onyx (we use useState)
 *   - No PopoverWithMeasuredContent (caller positions us absolutely)
 *   - Category icons = emoji chars instead of SVGs (visually identical)
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  Platform,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import emojis, { CATEGORIES, type PickerEmoji, type HeaderEmoji, type Emoji } from '@/assets/emojis/index';

type EmojiPickerPanelProps = {
  onEmojiSelected: (emoji: string) => void;
  onClose: () => void;
};

const EMOJI_COLUMNS = 8;
const EMOJI_CELL_SIZE = 38;
const HEADER_HEIGHT = 32;

function isHeader(item: PickerEmoji): item is HeaderEmoji {
  return 'header' in item && item.header === true;
}

export default function EmojiPickerPanel({ onEmojiSelected, onClose }: EmojiPickerPanelProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('smileysAndEmotion');
  const flatListRef = useRef<FlatList>(null);

  // Build the flat list data: interleave header rows and emoji rows (groups of EMOJI_COLUMNS)
  const { flatData, categoryIndexMap } = useMemo(() => {
    const source = searchQuery.trim()
      ? emojis.filter((item) => {
          if (isHeader(item)) return false;
          const e = item as Emoji;
          return e.name.replace(/_/g, ' ').includes(searchQuery.toLowerCase());
        })
      : emojis;

    // Group into rows: headers stay as-is, emojis chunked into rows of EMOJI_COLUMNS
    type Row =
      | { type: 'header'; item: HeaderEmoji }
      | { type: 'emojis'; items: Emoji[] };

    const rows: Row[] = [];
    const catIdx: Record<string, number> = {};
    let currentChunk: Emoji[] = [];

    const flushChunk = () => {
      if (currentChunk.length > 0) {
        rows.push({ type: 'emojis', items: [...currentChunk] });
        currentChunk = [];
      }
    };

    for (const item of source) {
      if (isHeader(item)) {
        flushChunk();
        catIdx[item.code] = rows.length;
        rows.push({ type: 'header', item });
      } else {
        currentChunk.push(item as Emoji);
        if (currentChunk.length === EMOJI_COLUMNS) {
          flushChunk();
        }
      }
    }
    flushChunk();

    return { flatData: rows, categoryIndexMap: catIdx };
  }, [searchQuery]);

  const scrollToCategory = useCallback(
    (code: string) => {
      const idx = categoryIndexMap[code];
      if (idx !== undefined && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: idx, animated: true });
        setSelectedCategory(code);
      }
    },
    [categoryIndexMap],
  );

  const renderRow = useCallback(
    ({ item }: { item: (typeof flatData)[0] }) => {
      if (item.type === 'header') {
        return (
          <View
            style={{
              height: HEADER_HEIGHT,
              justifyContent: 'flex-end',
              paddingHorizontal: 4,
              paddingBottom: 4,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: theme.textSupporting,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {item.item.label}
            </Text>
          </View>
        );
      }

      return (
        <View style={{ flexDirection: 'row' }}>
          {item.items.map((emoji) => (
            <Pressable
              key={emoji.code}
              onPress={() => {
                onEmojiSelected(emoji.code);
                onClose();
              }}
              style={({ pressed, hovered }) => [
                {
                  width: EMOJI_CELL_SIZE,
                  height: EMOJI_CELL_SIZE,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 6,
                  backgroundColor: (pressed || hovered) ? theme.highlightBG : 'transparent',
                  cursor: Platform.OS === 'web' ? 'pointer' as any : undefined,
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>{emoji.code}</Text>
            </Pressable>
          ))}
        </View>
      );
    },
    [theme, onEmojiSelected, onClose],
  );

  const keyExtractor = useCallback(
    (_: unknown, index: number) => `emoji_row_${index}`,
    [],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => {
      const row = flatData[index];
      const height = row?.type === 'header' ? HEADER_HEIGHT + 8 : EMOJI_CELL_SIZE;
      return { length: height, offset: 0, index }; // offset computed by FlatList
    },
    [flatData],
  );

  return (
    <View
      style={{
        backgroundColor: theme.componentBG,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 340,
        alignSelf: 'center',
        // shadow
        shadowColor: theme.inverse,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
      }}
    >
      {/* ── Header: title + close ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>Emoji</Text>
        <Pressable
          onPress={onClose}
          style={({ pressed, hovered }) => ({
            padding: 4,
            borderRadius: 6,
            backgroundColor: (pressed || hovered) ? theme.highlightBG : 'transparent',
            cursor: Platform.OS === 'web' ? 'pointer' as any : undefined,
          })}
        >
          <MaterialIcons name="close" size={18} color={theme.textSupporting} />
        </Pressable>
      </View>

      {/* ── Search bar (matches Expensify's EmojiPickerMenu search) ── */}
      <View
        style={{
          marginHorizontal: 12,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.highlightBG,
          borderRadius: 8,
          paddingHorizontal: 8,
          height: 34,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <MaterialIcons name="search" size={16} color={theme.textSupporting} style={{ marginRight: 4 }} />
        <TextInput
          placeholder="Search emoji..."
          placeholderTextColor={theme.placeholderText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[
            {
              flex: 1,
              fontSize: 13,
              color: theme.text,
              padding: 0,
            },
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {},
          ]}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={14} color={theme.textSupporting} />
          </Pressable>
        )}
      </View>

      {/* ── Category Shortcut Bar (mirrors Expensify's CategoryShortcutBar) ── */}
      {!searchQuery && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 40 }}
          contentContainerStyle={{
            flexDirection: 'row',
            paddingHorizontal: 8,
            paddingBottom: 4,
            gap: 2,
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.code;
            return (
              <Pressable
                key={cat.code}
                onPress={() => scrollToCategory(cat.code)}
                style={({ pressed, hovered }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor:
                    isActive
                      ? theme.activeComponentBG
                      : (pressed || hovered)
                      ? theme.highlightBG
                      : 'transparent',
                  cursor: Platform.OS === 'web' ? 'pointer' as any : undefined,
                })}
              >
                <Text style={{ fontSize: 18, opacity: isActive ? 1 : 0.6 }}>{cat.icon}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* thin separator */}
      <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 0 }} />

      {/* ── Emoji Grid (mirrors Expensify's FlashList with numColumns=EMOJI_NUM_PER_ROW) ── */}
      <FlatList
        ref={flatListRef}
        data={flatData}
        renderItem={renderRow}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        style={{ height: 280 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 8, paddingTop: 4 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        onScrollToIndexFailed={() => {}}
        ListEmptyComponent={
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text style={{ color: theme.textSupporting, fontSize: 13 }}>No results found</Text>
          </View>
        }
      />
    </View>
  );
}
