import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FormModal, type FormField } from "@/components/mobile/FormModal";
import { ScreenHeader } from "@/components/mobile/ScreenHeader";
import { EmptyState, Fab } from "@/components/mobile/Shared";
import { documentTypeOptions } from "@/constants/lookups";
import { useAuth } from "@/context/AuthContext";
import type { CaseItem, Client, DocumentItem } from "@/types/entities";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/api";

export default function DocumentsScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>({ isOriginal: false });

  const { data: documents = [], refetch } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiGet<DocumentItem[]>("/documents"),
  });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => apiGet<Client[]>("/clients") });
  const { data: cases = [] } = useQuery({ queryKey: ["cases"], queryFn: () => apiGet<CaseItem[]>("/cases") });

  const fields: FormField[] = [
    { key: "fileName", label: "اسم الملف" },
    { key: "fileUrl", label: "رابط الملف" },
    { key: "docType", label: "نوع المستند", type: "select", options: documentTypeOptions },
    { key: "caseId", label: "القضية", type: "select", options: cases.map((item) => ({ value: String(item.id), label: item.caseNumber })) },
    { key: "clientId", label: "الموكل", type: "select", options: clients.map((item) => ({ value: String(item.id), label: item.name })) },
    { key: "isOriginal", label: "أصل المستند", type: "switch" },
    { key: "notes", label: "ملاحظات", type: "textarea" },
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        fileName: String(values.fileName || "").trim(),
        fileUrl: String(values.fileUrl || "").trim() || null,
        docType: String(values.docType || "other"),
        caseId: values.caseId ? Number(values.caseId) : null,
        clientId: values.clientId ? Number(values.clientId) : null,
        isOriginal: Boolean(values.isOriginal),
        uploadedBy: user?.id ?? null,
        notes: String(values.notes || "").trim() || null,
      };
      if (!payload.fileName) throw new Error("اسم الملف مطلوب");
      return editing ? apiPatch(`/documents/${editing.id}`, payload) : apiPost("/documents", payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["documents"] });
      setModalOpen(false);
      setEditing(null);
      setValues({ isOriginal: false });
    },
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  function openCreate() {
    setEditing(null);
    setValues({
      caseId: cases[0] ? String(cases[0].id) : "",
      clientId: clients[0] ? String(clients[0].id) : "",
      docType: "other",
      isOriginal: false,
    });
    setModalOpen(true);
  }

  function openEdit(item: DocumentItem) {
    setEditing(item);
    setValues({
      fileName: item.fileName ?? "",
      fileUrl: item.fileUrl ?? "",
      docType: item.docType ?? "other",
      caseId: item.caseId ? String(item.caseId) : "",
      clientId: item.clientId ? String(item.clientId) : "",
      isOriginal: item.isOriginal,
      notes: item.notes ?? "",
    });
    setModalOpen(true);
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="المستندات" count={documents.length} back />
      <FlatList
        data={documents}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState icon="file-text" text="لا توجد مستندات" />}
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
                <Text style={styles.title}>{item.fileName ?? `مستند #${item.id}`}</Text>
                <Text style={styles.subtitle}>{item.docType ?? "other"}</Text>
              </View>
            </View>
            <Text style={styles.meta}>الرابط: {item.fileUrl ?? "—"}</Text>
            <Text style={styles.meta}>الرافع: {item.uploaderName ?? "—"}</Text>
          </View>
        )}
      />
      <Fab onPress={openCreate} />
      <FormModal
        visible={modalOpen}
        title={editing ? "تعديل المستند" : "إضافة مستند"}
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
