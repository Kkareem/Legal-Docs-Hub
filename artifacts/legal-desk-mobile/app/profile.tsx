import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ScreenHeader } from "@/components/mobile/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { apiPatch } from "@/utils/api";

export default function ProfileScreen() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => apiPatch(`/users/${user?.id}`, { name, phone: phone || null, password: password || undefined }),
    onSuccess: () => {
      setPassword("");
      Alert.alert("تم", "تم تحديث الملف الشخصي");
    },
    onError: (error: Error) => Alert.alert("خطأ", error.message),
  });

  return (
    <View style={styles.root}>
      <ScreenHeader title="الملف الشخصي" back />
      <View style={styles.card}>
        <Text style={styles.label}>الاسم</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} textAlign="right" />
        <Text style={styles.label}>البريد الإلكتروني</Text>
        <TextInput style={[styles.input, styles.readOnly]} value={user?.email ?? ""} editable={false} textAlign="right" />
        <Text style={styles.label}>الهاتف</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} textAlign="right" />
        <Text style={styles.label}>كلمة مرور جديدة</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry textAlign="right" />
        <TouchableOpacity style={styles.saveBtn} onPress={() => mutation.mutate()} disabled={mutation.isPending}>
          <Text style={styles.saveText}>{mutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F4F0" },
  card: { margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 16, gap: 10 },
  label: { fontSize: 13, fontWeight: "700", color: "#334155", textAlign: "right" },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    color: "#0F172A",
  },
  readOnly: {
    color: "#94A3B8",
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: "#C9A227",
    borderRadius: 16,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
