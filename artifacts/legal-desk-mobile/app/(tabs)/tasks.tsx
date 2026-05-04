import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { apiGet, apiPatch } from "@/utils/api";
import * as Haptics from "expo-haptics";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assigneeName: string | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  new:        { label: "جديد",      color: "#64748B", bg: "#F1F5F9", icon: "circle" },
  in_progress:{ label: "جاري",      color: "#3B82F6", bg: "#EFF6FF", icon: "loader" },
  done:       { label: "مكتمل",     color: "#10B981", bg: "#ECFDF5", icon: "check-circle" },
  cancelled:  { label: "ملغى",      color: "#EF4444", bg: "#FEF2F2", icon: "x-circle" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: "عاجل",   color: "#EF4444" },
  high:   { label: "مرتفع",  color: "#F59E0B" },
  normal: { label: "عادي",   color: "#3B82F6" },
  low:    { label: "منخفض",  color: "#94A3B8" },
};

const STATUS_FILTERS = ["all", "new", "in_progress", "done", "cancelled"] as const;

export default function TasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiGet<Task[]>("/tasks"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiPatch(`/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const filtered = useMemo(() => {
    let list = tasks ?? [];
    if (filterStatus !== "all") list = list.filter(t => t.status === filterStatus);
    return list;
  }, [tasks, filterStatus]);

  const toggleDone = async (task: Task) => {
    const next = task.status === "done" ? "new" : "done";
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateMutation.mutateAsync({ id: task.id, status: next });
  };

  const renderItem = ({ item }: { item: Task }) => {
    const sc = statusConfig[item.status] ?? statusConfig.new;
    const pc = priorityConfig[item.priority] ?? priorityConfig.normal;
    const isDone = item.status === "done";
    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !isDone;

    return (
      <View style={[styles.card, isDone && styles.cardDone]}>
        <View style={styles.cardRow}>
          <TouchableOpacity
            onPress={() => toggleDone(item)}
            style={[styles.checkBtn, isDone && { backgroundColor: "#10B981" }]}
          >
            <Feather name={isDone ? "check" : "circle"} size={16} color={isDone ? "#fff" : "#CBD5E1"} />
          </TouchableOpacity>
          <View style={styles.taskBody}>
            <Text style={[styles.taskTitle, isDone && styles.taskDone]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.taskMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: pc.color + "20" }]}>
                <Text style={[styles.priorityText, { color: pc.color }]}>{pc.label}</Text>
              </View>
              {item.dueDate && (
                <View style={styles.dateRow}>
                  <Text style={[styles.dateText, isOverdue && { color: "#EF4444" }]}>
                    {new Date(item.dueDate).toLocaleDateString("ar-SA", { day: "2-digit", month: "short" })}
                  </Text>
                  <Feather name="calendar" size={12} color={isOverdue ? "#EF4444" : "#94A3B8"} />
                </View>
              )}
            </View>
            {item.assigneeName && (
              <Text style={styles.assignee}>{item.assigneeName}</Text>
            )}
          </View>
          <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <View />
        <Text style={styles.headerTitle}>المهام</Text>
        <Text style={styles.headerCount}>{filtered.length}</Text>
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={STATUS_FILTERS as unknown as string[]}
        keyExtractor={k => k}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12, flexDirection: "row-reverse" }}
        renderItem={({ item }) => {
          const active = filterStatus === item;
          const sc = item !== "all" ? statusConfig[item] : null;
          return (
            <TouchableOpacity
              onPress={() => setFilterStatus(item)}
              style={[
                styles.filterChip,
                active && { backgroundColor: sc?.color ?? colors.primary, borderColor: sc?.color ?? colors.primary },
              ]}
            >
              <Text style={[styles.filterText, active && { color: "#fff" }]}>
                {item === "all" ? "الكل" : sc!.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

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
              <Feather name="check-square" size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>لا توجد مهام</Text>
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
  filterList: { maxHeight: 64 },
  filterChip: {
    height: 34, paddingHorizontal: 14, borderRadius: 17,
    borderWidth: 1.5, borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  filterText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardDone: { opacity: 0.65 },
  cardRow: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 },
  checkBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  taskBody: { flex: 1, alignItems: "flex-end" },
  taskTitle: { fontSize: 14, fontWeight: "600", color: "#1A1A2E", textAlign: "right", lineHeight: 20 },
  taskDone: { textDecorationLine: "line-through", color: "#94A3B8" },
  taskMeta: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginTop: 6 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 11, fontWeight: "700" },
  dateRow: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  dateText: { fontSize: 12, color: "#94A3B8" },
  assignee: { fontSize: 12, color: "#64748B", marginTop: 4, textAlign: "right" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#94A3B8" },
});
