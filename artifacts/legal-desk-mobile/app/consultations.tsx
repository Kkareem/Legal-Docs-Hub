import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FormModal, type FormField } from "@/components/mobile/FormModal";
import { ScreenHeader } from "@/components/mobile/ScreenHeader";
import { EmptyState, Fab } from "@/components/mobile/Shared";
import { consultationStatusOptions, paymentStatusOptions } from "@/constants/lookups";
import type { Client, Consultation, UserItem } from "@/types/entities";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/api";
import { formatCurrency } from "@/utils/format";

export default function ConsultationsScreen() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Consultation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>({});

  const { data: consultations = [], refetch } = useQuery({
    queryKey: ["consultations"],
    queryFn: () => apiGet<Consultation[]>("/consultations"),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiGet<Client[]>("/clients"),
  });
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<UserItem[]>("/users"),
  });

  const fields: FormField[] = [
    { key: "clientId", label: "الموكل", type: "select", options: clients.map((item) => ({ value: String(item.id), label: item.name })) },
    { key: "summary", label: "ملخص الاستشارة", type: "textarea" },
    { key: "paymentStatus", label: "حالة السداد", type: "select", options: paymentStatusOptions },
    { key: "fee", label: "الرسوم", type: "number" },
    { key: "status", label: "الحالة", type: "select", options: consultationStatusOptions },
    { key: "assignedTo", label: "المسؤول", type: "select", options: users.map((item) => ({ value: String(item.id), label: item.name })) },
    { key: "response", label: "الرد", type: "textarea" },
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        clientId: values.clientId ? Number(values.clientId) : null,
        summary: String(values.summary || "").trim(),
        paymentStatus: String(values.paymentStatus || "pending"),
        fee: values.fee ? Number(values.fee) : null,
        status: String(values.status || "new"),
        assignedTo: values.assignedTo ? Number(values.assignedTo) : null,
        response: String(values.response || "").trim() || null,
      };
      if (!payload.clientId) throw new Error("اختيار الموكل مطلوب");
      if (!payload.summary) throw new Error("ملخص الاستشارة مطلوب");
      return editing ? apiPatch(`/consultations/${editing.id}`, payload) : apiPost("/consultations", payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["consultations"] });
      setModalOpen(false);
      setEditing(null);
      setValues({});
    },
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/consultations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consultations"] }),
  });

  function openCreate() {
    setEditing(null);
    setValues({
      clientId: clients[0] ? String(clients[0].id) : "",
      assignedTo: users[0] ? String(users[0].id) : "",
      paymentStatus: "pending",
      status: "new",
    });
    setModalOpen(true);
  }

  function openEdit(item: Consultation) {
    setEditing(item);
    setValues({
      clientId: item.clientId ? String(item.clientId) : "",
      summary: item.summary,
      paymentStatus: item.paymentStatus ?? "pending",
      fee: item.fee ? String(item.fee) : "",
      status: item.status,
      assignedTo: item.assignedTo ? String(item.assignedTo) : "",
      response: item.response ?? "",
    });
    setModalOpen(true);
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="الاستشارات" count={consultations.length} back />
      <FlatList
        data={consultations}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState icon="message-square" text="لا توجد استشارات" />}
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
                <Text style={styles.title}>{item.clientName ?? `استشارة #${item.id}`}</Text>
                <Text style={styles.subtitle}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.meta}>{item.summary}</Text>
            <Text style={styles.meta}>الرسوم: {formatCurrency(item.fee)}</Text>
            <Text style={styles.meta}>المسؤول: {item.assigneeName ?? "—"}</Text>
          </View>
        )}
      />
      <Fab onPress={openCreate} />
      <FormModal
        visible={modalOpen}
        title={editing ? "تعديل الاستشارة" : "إضافة استشارة"}
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
