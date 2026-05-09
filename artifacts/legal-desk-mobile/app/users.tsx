import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FormModal, type FormField } from "@/components/mobile/FormModal";
import { ScreenHeader } from "@/components/mobile/ScreenHeader";
import { EmptyState, Fab } from "@/components/mobile/Shared";
import { userRoleOptions } from "@/constants/lookups";
import type { UserItem } from "@/types/entities";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/utils/api";

const roleMap = Object.fromEntries(userRoleOptions.map((item) => [item.value, item.label]));

export default function UsersScreen() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | boolean>>({
    role: "lawyer",
    active: true,
  });

  const { data: users = [], refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<UserItem[]>("/users"),
  });

  const fields: FormField[] = [
    { key: "name", label: "الاسم" },
    { key: "email", label: "البريد الإلكتروني" },
    { key: "phone", label: "الهاتف" },
    { key: "role", label: "الدور", type: "select", options: userRoleOptions },
    { key: "password", label: "كلمة المرور" },
    { key: "active", label: "نشط", type: "switch" },
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: String(values.name || "").trim(),
        email: String(values.email || "").trim(),
        phone: String(values.phone || "").trim() || null,
        role: String(values.role || "lawyer"),
        password: String(values.password || "").trim() || undefined,
        active: Boolean(values.active),
      };

      if (!payload.name) throw new Error("الاسم مطلوب");
      if (!editing && !payload.email) throw new Error("البريد الإلكتروني مطلوب");
      if (!editing && !payload.password) throw new Error("كلمة المرور مطلوبة");

      if (editing) {
        return apiPatch(`/users/${editing.id}`, payload);
      }

      return apiPost("/users", {
        ...payload,
        email: payload.email,
        password: payload.password,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      setModalOpen(false);
      setEditing(null);
      setValues({ role: "lawyer", active: true });
    },
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  function openCreate() {
    setEditing(null);
    setValues({ role: "lawyer", active: true });
    setModalOpen(true);
  }

  function openEdit(user: UserItem) {
    setEditing(user);
    setValues({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
      password: "",
      active: user.active,
    });
    setModalOpen(true);
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="المستخدمون" count={users.length} back />
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<EmptyState icon="user-check" text="لا يوجد مستخدمون" />}
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
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>{roleMap[item.role] ?? item.role}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaValue}>{item.email}</Text>
              <Text style={styles.metaLabel}>البريد</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaValue}>{item.phone ?? "—"}</Text>
              <Text style={styles.metaLabel}>الهاتف</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={[styles.metaValue, { color: item.active ? "#16A34A" : "#DC2626" }]}>{item.active ? "نشط" : "موقوف"}</Text>
              <Text style={styles.metaLabel}>الحالة</Text>
            </View>
          </View>
        )}
      />
      <Fab onPress={openCreate} />
      <FormModal
        visible={modalOpen}
        title={editing ? "تعديل المستخدم" : "إضافة مستخدم"}
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
  headerRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  titleWrap: { alignItems: "flex-end", flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: "#1B2A4A" },
  subtitle: { fontSize: 12, color: "#64748B", marginTop: 4 },
  actions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
  },
  metaRow: { flexDirection: "row-reverse", justifyContent: "space-between", paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  metaLabel: { fontSize: 12, color: "#94A3B8" },
  metaValue: { fontSize: 13, color: "#334155", textAlign: "right", flex: 1 },
});
