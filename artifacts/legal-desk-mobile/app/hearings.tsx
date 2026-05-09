import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FormModal, type FormField } from "@/components/mobile/FormModal";
import { ScreenHeader } from "@/components/mobile/ScreenHeader";
import { EmptyState, Fab } from "@/components/mobile/Shared";
import { hearingStatusOptions, hearingTypeOptions } from "@/constants/lookups";
import type { CaseItem, Hearing, UserItem } from "@/types/entities";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/api";
import { formatDateTime, toApiDateTime } from "@/utils/format";

export default function HearingsScreen() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Hearing | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>({});

  const { data: hearings = [], refetch } = useQuery({
    queryKey: ["hearings"],
    queryFn: () => apiGet<Hearing[]>("/hearings"),
  });
  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiGet<CaseItem[]>("/cases"),
  });
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<UserItem[]>("/users"),
  });

  const fields: FormField[] = [
    { key: "caseId", label: "القضية", type: "select", options: cases.map((item) => ({ value: String(item.id), label: item.caseNumber })) },
    { key: "datetime", label: "موعد الجلسة", type: "datetime", placeholder: "2026-05-07 10:30" },
    { key: "court", label: "المحكمة" },
    { key: "type", label: "نوع الجلسة", type: "select", options: hearingTypeOptions },
    { key: "assignedLawyer", label: "المحامي المسؤول", type: "select", options: users.map((item) => ({ value: String(item.id), label: item.name })) },
    { key: "status", label: "الحالة", type: "select", options: hearingStatusOptions },
    { key: "notes", label: "ملاحظات", type: "textarea" },
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        caseId: values.caseId ? Number(values.caseId) : null,
        datetime: toApiDateTime(String(values.datetime || "")),
        court: String(values.court || "").trim() || null,
        type: String(values.type || "hearing"),
        assignedLawyer: values.assignedLawyer ? Number(values.assignedLawyer) : null,
        status: String(values.status || "scheduled"),
        notes: String(values.notes || "").trim() || null,
      };
      if (!payload.caseId) throw new Error("اختيار القضية مطلوب");
      if (!payload.datetime) throw new Error("موعد الجلسة مطلوب");

      return editing ? apiPatch(`/hearings/${editing.id}`, payload) : apiPost("/hearings", payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["hearings"] });
      setModalOpen(false);
      setEditing(null);
      setValues({});
    },
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/hearings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hearings"] }),
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  function openCreate() {
    setEditing(null);
    setValues({
      caseId: cases[0] ? String(cases[0].id) : "",
      assignedLawyer: users[0] ? String(users[0].id) : "",
      type: "hearing",
      status: "scheduled",
    });
    setModalOpen(true);
  }

  function openEdit(item: Hearing) {
    setEditing(item);
    setValues({
      caseId: item.caseId ? String(item.caseId) : "",
      datetime: item.datetime ? item.datetime.slice(0, 16) : "",
      court: item.court ?? "",
      type: item.type ?? "hearing",
      assignedLawyer: item.assignedLawyer ? String(item.assignedLawyer) : "",
      status: item.status,
      notes: item.notes ?? "",
    });
    setModalOpen(true);
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="الجلسات" count={hearings.length} back />
      <FlatList
        data={hearings}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState icon="calendar" text="لا توجد جلسات" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => deleteMutation.mutate(item.id)}>
                  <Feather name="trash-2" size={16} color="#DC2626" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
                  <Feather name="edit-3" size={16} color="#1B2A4A" />
                </TouchableOpacity>
              </View>
              <View style={styles.titleWrap}>
                <Text style={styles.title}>{item.caseNumber ?? `جلسة #${item.id}`}</Text>
                <Text style={styles.subtitle}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.meta}>الموعد: {formatDateTime(item.datetime)}</Text>
            <Text style={styles.meta}>المحكمة: {item.court ?? "—"}</Text>
            <Text style={styles.meta}>المحامي: {item.assignedLawyerName ?? "—"}</Text>
          </View>
        )}
      />
      <Fab onPress={openCreate} />
      <FormModal
        visible={modalOpen}
        title={editing ? "تعديل الجلسة" : "إضافة جلسة"}
        fields={fields}
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
  root: { flex: 1, backgroundColor: "#F5F4F0" },
  content: { padding: 16, paddingBottom: 120, gap: 12, flexGrow: 1 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16 },
  headerRow: { flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 10 },
  actions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center" },
  titleWrap: { alignItems: "flex-end", flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: "#1B2A4A" },
  subtitle: { fontSize: 12, color: "#64748B", marginTop: 4 },
  meta: { fontSize: 13, color: "#475569", textAlign: "right", marginTop: 4 },
});
