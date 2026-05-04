import React from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { apiGet } from "@/utils/api";

interface Summary {
  activeCases: number;
  totalClients: number;
  pendingTasks: number;
  overdueTasks: number;
  todayHearings: number;
  upcomingHearings: number;
  totalPendingPayments: number;
}

interface UpcomingHearing {
  id: number;
  court: string | null;
  datetime: string;
  status: string;
}

interface OverdueTask {
  id: number;
  title: string;
  status: string;
  priority: string;
}

const priorityColor: Record<string, string> = {
  urgent: "#EF4444", high: "#F59E0B", normal: "#3B82F6", low: "#94A3B8",
};

export default function DashboardScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const { data: summary, isLoading: sLoading, refetch: refetchS } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiGet<Summary>("/dashboard/summary"),
  });

  const { data: hearings, isLoading: hLoading, refetch: refetchH } = useQuery({
    queryKey: ["upcoming-hearings"],
    queryFn: () => apiGet<UpcomingHearing[]>("/dashboard/upcoming-hearings"),
  });

  const { data: tasks, isLoading: tLoading, refetch: refetchT } = useQuery({
    queryKey: ["overdue-tasks"],
    queryFn: () => apiGet<OverdueTask[]>("/dashboard/overdue-tasks"),
  });

  const isRefreshing = sLoading || hLoading || tLoading;
  const onRefresh = () => { refetchS(); refetchH(); refetchT(); };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const kpis = [
    { label: "قضايا نشطة", value: summary?.activeCases ?? 0, icon: "briefcase", color: "#3B82F6", bg: "#EFF6FF" },
    { label: "جلسات اليوم", value: summary?.todayHearings ?? 0, icon: "calendar", color: "#8B5CF6", bg: "#F5F3FF" },
    { label: "مهام معلقة", value: summary?.pendingTasks ?? 0, icon: "check-square", color: "#F59E0B", bg: "#FFFBEB" },
    { label: "موكلون", value: summary?.totalClients ?? 0, icon: "users", color: "#10B981", bg: "#ECFDF5" },
  ];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 + (Platform.OS === "web" ? 34 : insets.bottom) }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={logout}>
          <Feather name="log-out" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerGreet}>مرحباً،</Text>
          <Text style={styles.headerName}>{user?.name ?? "المستخدم"}</Text>
        </View>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{user?.name?.[0] ?? "م"}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* Pending payments banner */}
        {(summary?.totalPendingPayments ?? 0) > 0 && (
          <View style={styles.banner}>
            <Feather name="alert-circle" size={16} color="#92400E" />
            <Text style={styles.bannerText}>
              مدفوعات معلقة: {summary!.totalPendingPayments.toLocaleString("ar-SA")} ر.س
            </Text>
          </View>
        )}

        {/* KPI grid */}
        {sLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.kpiGrid}>
            {kpis.map((k) => (
              <View key={k.label} style={[styles.kpiCard, { backgroundColor: k.bg }]}>
                <View style={[styles.kpiIcon, { backgroundColor: k.color + "20" }]}>
                  <Feather name={k.icon as any} size={18} color={k.color} />
                </View>
                <Text style={[styles.kpiVal, { color: k.color }]}>{k.value}</Text>
                <Text style={styles.kpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Overdue tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مهام متأخرة</Text>
          {tLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : !tasks?.length ? (
            <View style={styles.emptyState}>
              <Feather name="check-circle" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>لا توجد مهام متأخرة</Text>
            </View>
          ) : (
            tasks.slice(0, 5).map((t) => (
              <View key={t.id} style={styles.taskRow}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor[t.priority] ?? "#94A3B8" }]} />
                <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: (priorityColor[t.priority] ?? "#94A3B8") + "20" }]}>
                  <Text style={[styles.priorityText, { color: priorityColor[t.priority] ?? "#94A3B8" }]}>
                    {t.priority === "urgent" ? "عاجل" : t.priority === "high" ? "مرتفع" : t.priority === "normal" ? "عادي" : "منخفض"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Upcoming hearings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>جلسات قادمة</Text>
          {hLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : !hearings?.length ? (
            <View style={styles.emptyState}>
              <Feather name="calendar" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>لا توجد جلسات قادمة</Text>
            </View>
          ) : (
            hearings.slice(0, 5).map((h) => {
              const dt = new Date(h.datetime);
              return (
                <View key={h.id} style={styles.hearingRow}>
                  <View style={styles.hearingDate}>
                    <Text style={styles.hearingDay}>{dt.getDate()}</Text>
                    <Text style={styles.hearingMon}>{dt.toLocaleDateString("ar-SA", { month: "short" })}</Text>
                  </View>
                  <View style={styles.hearingInfo}>
                    <Text style={styles.hearingCourt} numberOfLines={1}>{h.court ?? `جلسة #${h.id}`}</Text>
                    <Text style={styles.hearingTime}>
                      {dt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  <View style={styles.hearingDot} />
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  headerText: { flex: 1, alignItems: "flex-end" },
  headerGreet: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  headerName: { fontSize: 20, fontWeight: "700", color: "#fff", marginTop: 2 },
  headerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#C9A227",
    alignItems: "center", justifyContent: "center",
  },
  headerAvatarText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  body: { padding: 16 },
  banner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  bannerText: { flex: 1, fontSize: 13, color: "#92400E", textAlign: "right" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  kpiCard: {
    width: "47%", borderRadius: 16, padding: 16,
    alignItems: "flex-end",
  },
  kpiIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  kpiVal: { fontSize: 28, fontWeight: "800", lineHeight: 32 },
  kpiLabel: { fontSize: 12, color: "#64748B", marginTop: 4, textAlign: "right" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1B2A4A", textAlign: "right", marginBottom: 12 },
  emptyState: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyText: { fontSize: 14, color: "#94A3B8" },
  taskRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 10,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4 },
  taskTitle: { flex: 1, fontSize: 14, color: "#374151", textAlign: "right" },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 11, fontWeight: "600" },
  hearingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  hearingDate: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center", justifyContent: "center",
  },
  hearingDay: { fontSize: 16, fontWeight: "700", color: "#1B2A4A" },
  hearingMon: { fontSize: 10, color: "#64748B" },
  hearingInfo: { flex: 1, alignItems: "flex-end" },
  hearingCourt: { fontSize: 14, fontWeight: "600", color: "#1A1A2E", textAlign: "right" },
  hearingTime: { fontSize: 12, color: "#64748B", marginTop: 2 },
  hearingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C9A227" },
});
