import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
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
import { clientStatusOptions, serviceTypeOptions } from "@/constants/lookups";
import { useColors } from "@/hooks/useColors";
import type { Client } from "@/types/entities";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/api";

const formFields: FormField[] = [
  { key: "name", label: "الاسم" },
  { key: "phone", label: "الهاتف" },
  { key: "email", label: "البريد الإلكتروني" },
  { key: "nationalId", label: "رقم الهوية" },
  { key: "address", label: "العنوان", type: "textarea" },
  { key: "status", label: "الحالة", type: "select", options: clientStatusOptions },
  { key: "serviceType", label: "نوع الخدمة", type: "select", options: serviceTypeOptions },
  { key: "notes", label: "ملاحظات", type: "textarea" },
];

const createInitial = (client?: Client) => ({
  name: client?.name ?? "",
  phone: client?.phone ?? "",
  email: client?.email ?? "",
  nationalId: client?.nationalId ?? "",
  address: client?.address ?? "",
  status: client?.status ?? "active",
  serviceType: client?.serviceType ?? "litigation",
  notes: client?.notes ?? "",
});

const statusMap = Object.fromEntries(clientStatusOptions.map((item) => [item.value, item.label]));
const serviceMap = Object.fromEntries(serviceTypeOptions.map((item) => [item.value, item.label]));

export default function ClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>(createInitial());

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiGet<Client[]>("/clients"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: String(values.name || "").trim(),
        phone: String(values.phone || "").trim() || null,
        email: String(values.email || "").trim() || null,
        nationalId: String(values.nationalId || "").trim() || null,
        address: String(values.address || "").trim() || null,
        status: String(values.status || "active"),
        serviceType: String(values.serviceType || "litigation"),
        notes: String(values.notes || "").trim() || null,
      };

      if (!payload.name) throw new Error("اسم الموكل مطلوب");

      if (editing) {
        return apiPatch(`/clients/${editing.id}`, payload);
      }

      return apiPost("/clients", payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clients"] });
      setModalOpen(false);
      setEditing(null);
      setValues(createInitial());
    },
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((client) => {
      if (!q) return true;
      return (
        client.name.toLowerCase().includes(q) ||
        (client.phone ?? "").includes(q) ||
        (client.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [clients, search]);

  function openCreate() {
    setEditing(null);
    setValues(createInitial());
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setValues(createInitial(client));
    setModalOpen(true);
  }

  function confirmDelete(client: Client) {
    Alert.alert("حذف الموكل", `سيتم حذف ${client.name}. هل تريد المتابعة؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => deleteMutation.mutate(client.id) },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="الموكلون" count={filtered.length} />
      <SearchBox value={search} onChangeText={setSearch} placeholder="بحث بالاسم أو الهاتف..." />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshing={false}
        onRefresh={refetch}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120 + insets.bottom,
          gap: 12,
          flexGrow: 1,
        }}
        ListEmptyComponent={!isLoading ? <EmptyState icon="users" text="لا يوجد موكلون" /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(item)}>
                  <Feather name="trash-2" size={16} color="#DC2626" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
                  <Feather name="edit-3" size={16} color="#1B2A4A" />
                </TouchableOpacity>
              </View>
              <View style={styles.titleWrap}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{statusMap[item.status] ?? item.status}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaValue}>{serviceMap[item.serviceType ?? ""] ?? "—"}</Text>
              <Text style={styles.metaLabel}>الخدمة</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaValue}>{item.phone ?? "—"}</Text>
              <Text style={styles.metaLabel}>الهاتف</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaValue}>{item.email ?? "—"}</Text>
              <Text style={styles.metaLabel}>البريد</Text>
            </View>
          </View>
        )}
      />

      <Fab onPress={openCreate} />

      <FormModal
        visible={modalOpen}
        title={editing ? "تعديل الموكل" : "إضافة موكل"}
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
  cardHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  titleWrap: { alignItems: "flex-end", flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B2A4A",
    textAlign: "right",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  actionRow: {
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
