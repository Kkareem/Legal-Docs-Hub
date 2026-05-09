import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FormModal, type FormField } from "@/components/mobile/FormModal";
import { ScreenHeader } from "@/components/mobile/ScreenHeader";
import { EmptyState, Fab } from "@/components/mobile/Shared";
import { poaStatusOptions } from "@/constants/lookups";
import type { CaseItem, Client, PowerOfAttorney, UserItem } from "@/types/entities";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/api";
import { formatDateTime, toApiDateTime } from "@/utils/format";

export default function PowersOfAttorneyScreen() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PowerOfAttorney | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>({});

  const { data: items = [], refetch } = useQuery({
    queryKey: ["powers-of-attorney"],
    queryFn: () => apiGet<PowerOfAttorney[]>("/powers-of-attorney"),
  });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => apiGet<Client[]>("/clients") });
  const { data: cases = [] } = useQuery({ queryKey: ["cases"], queryFn: () => apiGet<CaseItem[]>("/cases") });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => apiGet<UserItem[]>("/users") });

  const fields: FormField[] = [
    { key: "clientId", label: "الموكل", type: "select", options: clients.map((item) => ({ value: String(item.id), label: item.name })) },
    { key: "caseId", label: "القضية", type: "select", options: cases.map((item) => ({ value: String(item.id), label: item.caseNumber })) },
    { key: "receivedBy", label: "المستلم", type: "select", options: users.map((item) => ({ value: String(item.id), label: item.name })) },
    { key: "handedBy", label: "تم التسليم بواسطة" },
    { key: "receivedAt", label: "تاريخ الاستلام", type: "datetime", placeholder: "2026-05-07 10:30" },
    { key: "returnBy", label: "تاريخ الإرجاع المتوقع", type: "datetime", placeholder: "2026-05-10 10:30" },
    { key: "returnedAt", label: "تاريخ الإرجاع الفعلي", type: "datetime", placeholder: "2026-05-12 10:30" },
    { key: "status", label: "الحالة", type: "select", options: poaStatusOptions },
    { key: "notes", label: "ملاحظات", type: "textarea" },
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        clientId: values.clientId ? Number(values.clientId) : null,
        caseId: values.caseId ? Number(values.caseId) : null,
        receivedBy: values.receivedBy ? Number(values.receivedBy) : null,
        handedBy: String(values.handedBy || "").trim() || null,
        receivedAt: toApiDateTime(String(values.receivedAt || "")),
        returnBy: toApiDateTime(String(values.returnBy || "")),
        returnedAt: toApiDateTime(String(values.returnedAt || "")),
        status: String(values.status || "received"),
        notes: String(values.notes || "").trim() || null,
      };
      if (!payload.clientId) throw new Error("اختيار الموكل مطلوب");
      return editing ? apiPatch(`/powers-of-attorney/${editing.id}`, payload) : apiPost("/powers-of-attorney", payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["powers-of-attorney"] });
      setModalOpen(false);
      setEditing(null);
      setValues({});
    },
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/powers-of-attorney/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["powers-of-attorney"] }),
  });

  function openCreate() {
    setEditing(null);
    setValues({
      clientId: clients[0] ? String(clients[0].id) : "",
      caseId: cases[0] ? String(cases[0].id) : "",
      receivedBy: users[0] ? String(users[0].id) : "",
      status: "received",
    });
    setModalOpen(true);
  }

  function openEdit(item: PowerOfAttorney) {
    setEditing(item);
    setValues({
      clientId: item.clientId ? String(item.clientId) : "",
      caseId: item.caseId ? String(item.caseId) : "",
      receivedBy: item.receivedBy ? String(item.receivedBy) : "",
      handedBy: item.handedBy ?? "",
      receivedAt: item.receivedAt ? item.receivedAt.slice(0, 16) : "",
      returnBy: item.returnBy ? item.returnBy.slice(0, 16) : "",
      returnedAt: item.returnedAt ? item.returnedAt.slice(0, 16) : "",
      status: item.status,
      notes: item.notes ?? "",
    });
    setModalOpen(true);
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="الوكالات" count={items.length} back />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState icon="clipboard" text="لا توجد وكالات" />}
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
                <Text style={styles.title}>{item.clientName ?? `وكالة #${item.id}`}</Text>
                <Text style={styles.subtitle}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.meta}>القضية: {item.caseNumber ?? "—"}</Text>
            <Text style={styles.meta}>المستلم: {item.receivedByName ?? "—"}</Text>
            <Text style={styles.meta}>الاستلام: {formatDateTime(item.receivedAt)}</Text>
          </View>
        )}
      />
      <Fab onPress={openCreate} />
      <FormModal
        visible={modalOpen}
        title={editing ? "تعديل الوكالة" : "إضافة وكالة"}
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
