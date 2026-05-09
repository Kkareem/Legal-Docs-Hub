import { Feather } from "@expo/vector-icons";
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
import { EmptyState, Fab, SearchBox } from "@/components/mobile/Shared";
import { caseStatusOptions, caseTypeOptions } from "@/constants/lookups";
import { useColors } from "@/hooks/useColors";
import type { CaseItem, Client, UserItem } from "@/types/entities";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/api";

const statusMap = Object.fromEntries(caseStatusOptions.map((item) => [item.value, item.label]));
const typeMap = Object.fromEntries(caseTypeOptions.map((item) => [item.value, item.label]));

export default function CasesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CaseItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>({});

  const { data: cases = [], isLoading, refetch } = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiGet<CaseItem[]>("/cases"),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiGet<Client[]>("/clients"),
  });
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<UserItem[]>("/users"),
  });

  const clientOptions = clients.map((client) => ({ value: String(client.id), label: client.name }));
  const userOptions = users.map((user) => ({ value: String(user.id), label: user.name }));

  const formFields: FormField[] = [
    { key: "caseNumber", label: "رقم القضية" },
    { key: "courtCaseNumber", label: "رقم المحكمة" },
    { key: "type", label: "نوع القضية", type: "select", options: caseTypeOptions },
    { key: "status", label: "الحالة", type: "select", options: caseStatusOptions },
    { key: "clientId", label: "الموكل", type: "select", options: clientOptions },
    { key: "leadLawyerId", label: "المحامي المسؤول", type: "select", options: userOptions },
    { key: "court", label: "المحكمة" },
    { key: "division", label: "الدائرة" },
    { key: "opposingParty", label: "الخصم" },
    { key: "description", label: "الوصف", type: "textarea" },
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        caseNumber: String(values.caseNumber || "").trim(),
        courtCaseNumber: String(values.courtCaseNumber || "").trim() || null,
        type: String(values.type || "civil"),
        status: String(values.status || "active"),
        clientId: Number(values.clientId || 0),
        leadLawyerId: values.leadLawyerId ? Number(values.leadLawyerId) : null,
        court: String(values.court || "").trim() || null,
        division: String(values.division || "").trim() || null,
        opposingParty: String(values.opposingParty || "").trim() || null,
        description: String(values.description || "").trim() || null,
      };

      if (!payload.caseNumber) throw new Error("رقم القضية مطلوب");
      if (!payload.clientId) throw new Error("اختيار الموكل مطلوب");

      if (editing) {
        return apiPatch(`/cases/${editing.id}`, payload);
      }

      return apiPost("/cases", payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["cases"] });
      setModalOpen(false);
      setEditing(null);
      setValues({});
    },
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/cases/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] }),
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cases.filter((item) => {
      if (!q) return true;
      return (
        item.caseNumber.toLowerCase().includes(q) ||
        (item.clientName ?? "").toLowerCase().includes(q) ||
        (item.court ?? "").toLowerCase().includes(q)
      );
    });
  }, [cases, search]);

  function openCreate() {
    setEditing(null);
    setValues({
      type: "civil",
      status: "active",
      clientId: clientOptions[0]?.value ?? "",
      leadLawyerId: userOptions[0]?.value ?? "",
    });
    setModalOpen(true);
  }

  function openEdit(item: CaseItem) {
    setEditing(item);
    setValues({
      caseNumber: item.caseNumber,
      courtCaseNumber: item.courtCaseNumber ?? "",
      type: item.type,
      status: item.status,
      clientId: String(item.clientId),
      leadLawyerId: item.leadLawyerId ? String(item.leadLawyerId) : "",
      court: item.court ?? "",
      division: item.division ?? "",
      opposingParty: item.opposingParty ?? "",
      description: item.description ?? "",
    });
    setModalOpen(true);
  }

  function confirmDelete(item: CaseItem) {
    Alert.alert("حذف القضية", `سيتم حذف ${item.caseNumber}. هل تريد المتابعة؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="القضايا" count={filtered.length} />
      <SearchBox value={search} onChangeText={setSearch} />

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
          ListEmptyComponent={<EmptyState icon="briefcase" text="لا توجد قضايا" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(item)}>
                    <Feather name="trash-2" size={16} color="#DC2626" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
                    <Feather name="edit-3" size={16} color="#1B2A4A" />
                  </TouchableOpacity>
                </View>
                <View style={styles.titleWrap}>
                  <Text style={styles.caseNumber}>{item.caseNumber}</Text>
                  <Text style={styles.caseMeta}>{statusMap[item.status] ?? item.status}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaValue}>{item.clientName ?? "—"}</Text>
                <Text style={styles.metaLabel}>الموكل</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaValue}>{typeMap[item.type] ?? item.type}</Text>
                <Text style={styles.metaLabel}>النوع</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaValue}>{item.court ?? "—"}</Text>
                <Text style={styles.metaLabel}>المحكمة</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaValue}>{item.leadLawyerName ?? "—"}</Text>
                <Text style={styles.metaLabel}>المحامي</Text>
              </View>
            </View>
          )}
        />
      )}

      <Fab onPress={openCreate} />

      <FormModal
        visible={modalOpen}
        title={editing ? "تعديل القضية" : "إضافة قضية"}
        fields={formFields}
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
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  titleWrap: {
    alignItems: "flex-end",
    flex: 1,
  },
  caseNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B2A4A",
  },
  caseMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
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
