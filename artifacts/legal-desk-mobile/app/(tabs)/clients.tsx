import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { apiGet } from "@/utils/api";

interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  type: string;
  nationalId: string | null;
}

const typeLabels: Record<string, string> = { individual: "فرد", company: "شركة" };
const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "#10B981" },
  inactive: { label: "غير نشط", color: "#94A3B8" },
  vip: { label: "VIP", color: "#C9A227" },
  blacklisted: { label: "محظور", color: "#EF4444" },
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
}

const AVATAR_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#1B2A4A"];

export default function ClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiGet<Client[]>("/clients"),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (clients ?? []).filter(c =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const renderItem = ({ item, index }: { item: Client; index: number }) => {
    const sc = statusConfig[item.status] ?? { label: item.status, color: "#94A3B8" };
    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardInfo}>
            {item.phone && (
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{item.phone}</Text>
                <Feather name="phone" size={13} color="#94A3B8" />
              </View>
            )}
            {item.email && (
              <View style={styles.metaRow}>
                <Text style={styles.metaText} numberOfLines={1}>{item.email}</Text>
                <Feather name="mail" size={13} color="#94A3B8" />
              </View>
            )}
            <View style={styles.footerRow}>
              <Text style={[styles.statusBadge, { color: sc.color }]}>{sc.label}</Text>
              <Text style={styles.typeText}>{typeLabels[item.type] ?? item.type}</Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initials(item.name)}</Text>
            </View>
            <Text style={styles.clientName}>{item.name}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <View />
        <Text style={styles.headerTitle}>الموكلون</Text>
        <Text style={styles.headerCount}>{filtered.length}</Text>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث بالاسم أو الهاتف..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 100 + (Platform.OS === "web" ? 34 : insets.bottom),
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filtered.length}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>لا يوجد موكلون</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerCount: {
    fontSize: 13, color: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A2E" },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardRow: { flexDirection: "row-reverse", gap: 14 },
  cardRight: { alignItems: "flex-end", minWidth: 80 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  avatarText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  clientName: { fontSize: 13, fontWeight: "600", color: "#1B2A4A", textAlign: "right", maxWidth: 90 },
  cardInfo: { flex: 1, justifyContent: "center", gap: 4 },
  metaRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  metaText: { flex: 1, fontSize: 13, color: "#475569", textAlign: "right" },
  footerRow: { flexDirection: "row-reverse", gap: 8, marginTop: 4 },
  statusBadge: { fontSize: 12, fontWeight: "700" },
  typeText: { fontSize: 12, color: "#94A3B8" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#94A3B8" },
});
