import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/mobile/ScreenHeader";
import { useColors } from "@/hooks/useColors";

const items = [
  { title: "الجلسات", route: "/hearings", icon: "calendar" },
  { title: "الاستشارات", route: "/consultations", icon: "message-square" },
  { title: "المدفوعات", route: "/payments", icon: "credit-card" },
  { title: "المستندات", route: "/documents", icon: "file-text" },
  { title: "الوكالات", route: "/powers-of-attorney", icon: "clipboard" },
  { title: "الإشعارات", route: "/notifications", icon: "bell" },
  { title: "المستخدمون", route: "/users", icon: "user-check" },
  { title: "الملف الشخصي", route: "/profile", icon: "user" },
] as const;

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="المزيد" count={items.length} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.route}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 + insets.bottom, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(item.route as never)}>
            <View style={styles.iconWrap}>
              <Feather name={item.icon} size={22} color="#1B2A4A" />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Feather name="chevron-left" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gridRow: {
    gap: 12,
  },
  card: {
    flex: 1,
    minHeight: 132,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    alignItems: "flex-end",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B2A4A",
  },
});
