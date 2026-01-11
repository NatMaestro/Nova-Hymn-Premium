import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "login" | "register";
}

export default function AuthModal({
  visible,
  onClose,
  onSuccess,
  mode: initialMode = "login",
}: AuthModalProps) {
  const { theme } = useTheme();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const handleSubmit = async () => {
    if (mode === "login") {
      if (!username || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }
      
      try {
        setLoading(true);
        await login(username, password);
        Alert.alert("Success", "Logged in successfully!");
        resetForm();
        onSuccess();
        onClose();
      } catch (error: any) {
        Alert.alert("Login Failed", error.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Register
      if (!username || !email || !password || !password2) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }
      
      if (password !== password2) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }
      
      if (password.length < 8) {
        Alert.alert("Error", "Password must be at least 8 characters");
        return;
      }
      
      try {
        setLoading(true);
        await register(username, email, password, password2);
        Alert.alert("Success", "Account created successfully!");
        resetForm();
        onSuccess();
        onClose();
      } catch (error: any) {
        Alert.alert("Registration Failed", error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setPassword2("");
  };

  const switchMode = () => {
    resetForm();
    setMode(mode === "login" ? "register" : "login");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.header}>
            <Text
              style={[styles.title, { color: theme.colors.text }]}
            >
              {mode === "login" ? "Login" : "Create Account"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            >
              {mode === "login"
                ? "Sign in to access premium features"
                : "Create an account to subscribe to premium"}
            </Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.label, { color: theme.colors.text }]}
                >
                  Username
                </Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                />
              </View>

              {mode === "register" && (
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.label, { color: theme.colors.text }]}
                  >
                    Email
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      },
                    ]}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.label, { color: theme.colors.text }]}
                >
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                />
              </View>

              {mode === "register" && (
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.label, { color: theme.colors.text }]}
                  >
                    Confirm Password
                  </Text>
                  <TextInput
                    value={password2}
                    onChangeText={setPassword2}
                    placeholder="Confirm your password"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      },
                    ]}
                  />
                </View>
              )}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: theme.colors.textSecondary,
                    opacity: loading ? 0.6 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {mode === "login" ? "Login" : "Create Account"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={switchMode} style={styles.switchButton}>
                <Text
                  style={[styles.switchText, { color: theme.colors.textSecondary }]}
                >
                  {mode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Login"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: "80%",
    paddingBottom: Platform.OS === "android" ? 20 : 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E4",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "300",
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

