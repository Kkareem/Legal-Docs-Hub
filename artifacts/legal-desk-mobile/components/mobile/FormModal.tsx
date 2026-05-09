import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type FormField =
  | {
      key: string;
      label: string;
      type?: "text" | "number" | "textarea" | "datetime";
      placeholder?: string;
    }
  | {
      key: string;
      label: string;
      type: "select";
      options: ReadonlyArray<{ value: string; label: string }>;
    }
  | {
      key: string;
      label: string;
      type: "switch";
    };

interface FormModalProps {
  visible: boolean;
  title: string;
  fields: FormField[];
  values: Record<string, string | boolean>;
  submitting?: boolean;
  submitLabel?: string;
  onChange: (key: string, value: string | boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function FormModal({
  visible,
  title,
  fields,
  values,
  submitting,
  submitLabel = "حفظ",
  onChange,
  onClose,
  onSubmit,
}: FormModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>إلغاء</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 48 }} />
        </View>
        <ScrollView
          contentContainerStyle={styles.formBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {fields.map((field) => {
            const value = values[field.key];

            if (field.type === "select") {
              return (
                <View key={field.key} style={styles.fieldWrap}>
                  <Text style={styles.label}>{field.label}</Text>
                  <View style={styles.chipsWrap}>
                    {field.options.map((option) => {
                      const active = value === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => onChange(field.key, option.value)}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            }

            if (field.type === "switch") {
              return (
                <View key={field.key} style={[styles.fieldWrap, styles.switchRow]}>
                  <Switch
                    value={Boolean(value)}
                    onValueChange={(next) => onChange(field.key, next)}
                    trackColor={{ false: "#CBD5E1", true: "#1B2A4A" }}
                    thumbColor="#fff"
                  />
                  <Text style={styles.label}>{field.label}</Text>
                </View>
              );
            }

            const multiline = field.type === "textarea";
            const keyboardType = field.type === "number" ? "numeric" : "default";
            return (
              <View key={field.key} style={styles.fieldWrap}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={[styles.input, multiline && styles.textarea]}
                  value={String(value ?? "")}
                  onChangeText={(text) => onChange(field.key, text)}
                  placeholder={field.placeholder}
                  placeholderTextColor="#94A3B8"
                  textAlign="right"
                  multiline={multiline}
                  keyboardType={keyboardType}
                />
              </View>
            );
          })}
        </ScrollView>
        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={onSubmit} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? "جارٍ الحفظ..." : submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  sheet: {
    marginTop: "auto",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    maxHeight: "86%",
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  closeText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B2A4A",
  },
  formBody: {
    gap: 14,
    paddingBottom: 12,
  },
  fieldWrap: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    textAlign: "right",
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    color: "#0F172A",
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  chipsWrap: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: "#1B2A4A",
    borderColor: "#1B2A4A",
  },
  chipText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  submitBtn: {
    marginTop: 12,
    backgroundColor: "#C9A227",
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
