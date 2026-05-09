import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenHeader } from "@/components/mobile/ScreenHeader";
import { EmptyState } from "@/components/mobile/Shared";
import type { NotificationItem } from "@/types/entities";
import { apiGet, apiPatch } from "@/utils/api";
import { formatDateTime } from "@/utils/format";

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet<NotificationItem[]>("/notifications"),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => apiPatch(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: () => apiPatch("/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <View style={styles.root}>
      <ScreenHeader title="الإشعارات" count={notifications.length} back actionIcon="check-circle" onActionPress={() => markAll.mutate()} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState icon="bell" text="لا توجد إشعارات" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.unread]}
            onPress={() => !item.read && markRead.mutate(item.id)}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.dot, { backgroundColor: item.read ? "#CBD5E1" : "#C9A227" }]} />
              <View style={styles.textWrap}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </View>
            </View>
            <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F4F0" },
  content: { padding: 16, paddingBottom: 120, gap: 12, flexGrow: 1 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16 },
  unread: { borderWidth: 1, borderColor: "#F3E3A4" },
  cardHeader: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  textWrap: { flex: 1, alignItems: "flex-end" },
  title: { fontSize: 15, fontWeight: "700", color: "#1B2A4A", textAlign: "right" },
  body: { fontSize: 13, color: "#475569", textAlign: "right", marginTop: 4 },
  date: { marginTop: 10, fontSize: 11, color: "#94A3B8", textAlign: "right" },
});
