import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormModal, type FormField } from "@/components/mobile/FormModal";
import { ScreenHeader } from "@/components/mobile/ScreenHeader";
import { EmptyState, Fab } from "@/components/mobile/Shared";
import { taskPriorityOptions, taskStatusOptions } from "@/constants/lookups";
import { useColors } from "@/hooks/useColors";
import type { CaseItem, TaskItem, UserItem } from "@/types/entities";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/api";
import { formatDateTime, toApiDateTime } from "@/utils/format";

const statusMap = Object.fromEntries(taskStatusOptions.map((item) => [item.value, item.label]));
const priorityMap = Object.fromEntries(taskPriorityOptions.map((item) => [item.value, item.label]));

export default function TasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [editing, setEditing] = useState<TaskItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>({});

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiGet<TaskItem[]>("/tasks"),
  });
  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiGet<CaseItem[]>("/cases"),
  });
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<UserItem[]>("/users"),
  });

  const caseOptions = cases.map((item) => ({ value: String(item.id), label: item.caseNumber }));
  const userOptions = users.map((item) => ({ value: String(item.id), label: item.name }));
  const taskFields: FormField[] = [
    { key: "title", label: "عنوان المهمة" },
    { key: "description", label: "الوصف", type: "textarea" },
    { key: "caseId", label: "القضية", type: "select", options: caseOptions },
    { key: "assignedTo", label: "المسند إليه", type: "select", options: userOptions },
    { key: "dueDate", label: "موعد الاستحقاق", type: "datetime", placeholder: "2026-05-07 14:30" },
    { key: "priority", label: "الأولوية", type: "select", options: taskPriorityOptions },
    { key: "status", label: "الحالة", type: "select", options: taskStatusOptions },
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: String(values.title || "").trim(),
        description: String(values.description || "").trim() || null,
        caseId: values.caseId ? Number(values.caseId) : null,
        assignedTo: values.assignedTo ? Number(values.assignedTo) : null,
        dueDate: toApiDateTime(String(values.dueDate || "")),
        priority: String(values.priority || "normal"),
        status: String(values.status || "new"),
      };
      if (!payload.title) throw new Error("عنوان المهمة مطلوب");

      if (editing) {
        return apiPatch(`/tasks/${editing.id}`, payload);
      }

      return apiPost("/tasks", payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      setModalOpen(false);
      setEditing(null);
      setValues({});
    },
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiPatch(`/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const filtered = useMemo(() => {
    if (filterStatus === "all") return tasks;
    return tasks.filter((item) => item.status === filterStatus);
  }, [tasks, filterStatus]);

  function openCreate() {
    setEditing(null);
    setValues({
      priority: "normal",
      status: "new",
      caseId: caseOptions[0]?.value ?? "",
      assignedTo: userOptions[0]?.value ?? "",
    });
    setModalOpen(true);
  }

  function openEdit(item: TaskItem) {
    setEditing(item);
    setValues({
      title: item.title,
      description: item.description ?? "",
      caseId: item.caseId ? String(item.caseId) : "",
      assignedTo: item.assignedTo ? String(item.assignedTo) : "",
      dueDate: item.dueDate ? item.dueDate.slice(0, 16) : "",
      priority: item.priority,
      status: item.status,
    });
    setModalOpen(true);
  }

  function confirmDelete(item: TaskItem) {
    Alert.alert("حذف المهمة", `سيتم حذف "${item.title}". هل تريد المتابعة؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
    ]);
  }

  async function toggleDone(item: TaskItem) {
    const nextStatus = item.status === "done" ? "new" : "done";
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    statusMutation.mutate({ id: item.id, status: nextStatus });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="المهام" count={filtered.length} />

      <FlatList
        horizontal
        data={["all", ...taskStatusOptions.map((item) => item.value)]}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterWrap}
        renderItem={({ item }) => {
          const active = filterStatus === item;
          return (
            <TouchableOpacity
              style={[styles.filterChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setFilterStatus(item)}
            >
              <Text style={[styles.filterText, active && { color: "#fff" }]}>
                {item === "all" ? "الكل" : statusMap[item] ?? item}
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
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 120 + insets.bottom,
            gap: 12,
            flexGrow: 1,
          }}
          ListEmptyComponent={<EmptyState icon="check-square" text="لا توجد مهام" />}
          renderItem={({ item }) => (
            <View style={[styles.card, item.status === "done" && styles.doneCard]}>
              <View style={styles.cardRow}>
                <View style={styles.leftActions}>
                  <TouchableOpacity style={styles.roundBtn} onPress={() => confirmDelete(item)}>
                    <Feather name="trash-2" size={15} color="#DC2626" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.roundBtn} onPress={() => openEdit(item)}>
                    <Feather name="edit-3" size={15} color="#1B2A4A" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.roundBtn, item.status === "done" && styles.doneBtn]} onPress={() => toggleDone(item)}>
                    <Feather name={item.status === "done" ? "check" : "circle"} size={15} color={item.status === "done" ? "#fff" : "#CBD5E1"} />
                  </TouchableOpacity>
                </View>
                <View style={styles.taskBody}>
                  <Text style={[styles.taskTitle, item.status === "done" && styles.doneTitle]}>{item.title}</Text>
                  <Text style={styles.taskMeta}>{priorityMap[item.priority] ?? item.priority} • {statusMap[item.status] ?? item.status}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaValue}>{item.assigneeName ?? "—"}</Text>
                <Text style={styles.metaLabel}>المسند إليه</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaValue}>{item.caseNumber ?? "—"}</Text>
                <Text style={styles.metaLabel}>القضية</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaValue}>{formatDateTime(item.dueDate)}</Text>
                <Text style={styles.metaLabel}>الاستحقاق</Text>
              </View>
            </View>
          )}
        />
      )}

      <Fab onPress={openCreate} />

      <FormModal
        visible={modalOpen}
        title={editing ? "تعديل المهمة" : "إضافة مهمة"}
        fields={taskFields}
        values={values}
        submitting={saveMutation.isPending}
        submitLabel={editing ? "تحديث" : "إضافة"}
        onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        onClose={() => setModalOpen(false)}
        onSubmit={() => saveMutation.mutate()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filterWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: "row-reverse",
  },
  filterChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  doneCard: {
    opacity: 0.7,
  },
  cardRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    gap: 12,
  },
  leftActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  roundBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtn: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  taskBody: {
    flex: 1,
    alignItems: "flex-end",
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B2A4A",
    textAlign: "right",
  },
  doneTitle: {
    textDecorationLine: "line-through",
    color: "#64748B",
  },
  taskMeta: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
  },
  metaRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  metaLabel: {
    fontSize: 12,
    color: "#94A3B8",
  },
  metaValue: {
    fontSize: 13,
    color: "#334155",
    textAlign: "right",
    flex: 1,
  },
});
