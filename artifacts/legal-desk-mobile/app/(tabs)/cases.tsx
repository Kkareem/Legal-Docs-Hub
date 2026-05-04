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

interface Case {
  id: number;
  caseNumber: string;
  courtCaseNumber: string | null;
  type: string;
  status: string;
  court: string | null;
  clientName: string | null;
  leadLawyerName: string | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new:              { label: "جديد",       color: "#64748B", bg: "#F1F5F9" },
  active:           { label: "نشط",        color: "#2563EB", bg: "#EFF6FF" },
  upcoming_hearing: { label: "جلسة",      color: "#D97706", bg: "#FFFBEB" },
  verdict:          { label: "حكم",       color: "#7C3AED", bg: "#F5F3FF" },
  adjourned:        { label: "مؤجل",      color: "#EA580C", bg: "#FFF7ED" },
  closed:           { label: "مغلق",      color: "#EF4444", bg: "#FEF2F2" },
};

const typeLabels: Record<string, string> = {
  civil: "مدني", criminal: "جنائي", commercial: "تجاري",
  family: "أسري", labor: "عمالي", administrative: "إداري", other: "أخرى",
};

const STATUS_KEYS = Object.keys(statusConfig);

export default function CasesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: cases, isLoading, refetch } = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiGet<Case[]>("/cases"),
  });

  const filtered = useMemo(() => {
    let list = cases ?? [];
    const q = search.toLowerCase();
    if (q) list = list.filter(c =>
      c.caseNumber.toLowerCase().includes(q) ||
      (c.court ?? "").toLowerCase().includes(q) ||
      (c.clientName ?? "").toLowerCase().includes(q)
    );
    if (filterStatus !== "all") list = list.filter(c => c.status === filterStatus);
    return list;
  }, [cases, search, filterStatus]);

  const renderItem = ({ item }: { item: Case }) => {
    const sc = statusConfig[item.status] ?? { label: item.status, color: "#64748B", bg: "#F1F5F9" };
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.color }]}>{sc.label}</Text>
          </View>
          <Text style={styles.caseNum}>{item.caseNumber}</Text>
        </View>
        {item.clientName && (
          <View style={styles.row}>
            <Text style={styles.metaVal} numberOfLines={1}>{item.clientName}</Text>
            <Feather name="user" size={13} color="#94A3B8" />
          </View>
        )}
        {item.court && (
          <View style={styles.row}>
            <Text style={styles.metaVal} numberOfLines={1}>{item.court}</Text>
            <Feather name="map-pin" size={13} color="#94A3B8" />
          </View>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.typeBadge}>{typeLabels[item.type] ?? item.type}</Text>
          {item.leadLawyerName && (
            <Text style={styles.lawyer} numberOfLines={1}>{item.leadLawyerName}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <View />
        <Text style={styles.headerTitle}>القضايا</Text>
        <Text style={styles.headerCount}>{filtered.length}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
        </View>
      </View>

      {/* Status filters */}
      <FlatList
        horizontal
        data={["all", ...STATUS_KEYS]}
        keyExtractor={k => k}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, flexDirection: "row-reverse" }}
        renderItem={({ item }) => {
          const active = filterStatus === item;
          const sc = item !== "all" ? statusConfig[item] : null;
          return (
            <TouchableOpacity
              onPress={() => setFilterStatus(item)}
              style={[
                styles.filterChip,
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
                !active && sc && { borderColor: sc.color + "40" },
              ]}
            >
              <Text style={[styles.filterText, active && { color: "#fff" }]}>
                {item === "all" ? "الكل" : sc!.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* List */}
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
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filtered.length}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="briefcase" size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>لا توجد قضايا</Text>
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
  filterList: { maxHeight: 48, marginBottom: 4 },
  filterChip: {
    height: 34, paddingHorizontal: 14, borderRadius: 17,
    borderWidth: 1.5, borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  filterText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  caseNum: { fontSize: 16, fontWeight: "700", color: "#1B2A4A" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 6, marginBottom: 4 },
  metaVal: { flex: 1, fontSize: 13, color: "#475569", textAlign: "right" },
  cardFooter: { flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  typeBadge: { fontSize: 12, color: "#2563EB", backgroundColor: "#EFF6FF", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontWeight: "600" },
  lawyer: { fontSize: 12, color: "#64748B", maxWidth: 140, textAlign: "left" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#94A3B8" },
});
