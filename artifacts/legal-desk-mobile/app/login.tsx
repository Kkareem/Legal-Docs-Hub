import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert("خطأ", e.message ?? "بيانات الدخول غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Feather name="briefcase" size={32} color="#C9A227" />
          </View>
          <Text style={styles.appName}>LegalDesk</Text>
          <Text style={styles.appSub}>منصة إدارة المكتب القانوني</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>تسجيل الدخول</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <View style={styles.inputRow}>
              <Feather name="mail" size={16} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="attorney@firm.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>كلمة المرور</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.inputIcon}>
                <Feather name={showPass ? "eye-off" : "eye"} size={16} color="#64748B" />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                textAlign="right"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>تسجيل الدخول</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>admin@legaldesk.sa / password123</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1B2A4A" },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  logoWrap: { alignItems: "center", marginBottom: 36 },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: "#243756",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(201,162,39,0.3)",
  },
  appName: { fontSize: 28, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  appSub: { fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#1B2A4A", textAlign: "right", marginBottom: 20 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", textAlign: "right", marginBottom: 6 },
  inputRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#F8FAFC",
  },
  inputIcon: { marginLeft: 8 },
  input: { flex: 1, fontSize: 15, color: "#1A1A2E", height: 48 },
  btn: {
    backgroundColor: "#C9A227",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  hint: { textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 20 },
});
