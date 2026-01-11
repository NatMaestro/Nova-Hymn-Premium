import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { useDenomination } from "@/contexts/DenominationContext";
import { useTheme } from "@/contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.75, 320);

interface DenominationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DenominationSidebar({
  isOpen,
  onClose,
}: DenominationSidebarProps) {
  const {
    selectedDenomination,
    selectedPeriod,
    denominations,
    setSelectedDenomination,
    setSelectedPeriod,
  } = useDenomination();
  const { theme } = useTheme();
  const [slideAnim] = useState(new Animated.Value(-SIDEBAR_WIDTH));

  React.useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const handleSelectDenomination = (denomination: any) => {
    setSelectedDenomination(denomination);
    if (denomination.slug !== "catholic") {
      setSelectedPeriod(null);
    }
    // Don't close sidebar immediately - let user select period if needed
  };

  const handleSelectPeriod = (period: "new" | "old") => {
    setSelectedPeriod(period);
    // Close sidebar after period selection
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const isCatholic = selectedDenomination?.slug === "catholic";

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.sidebar,
              {
                backgroundColor: theme.colors.background,
                transform: [{ translateX: slideAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Select Denomination
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text
                  style={[styles.closeButtonText, { color: theme.colors.text }]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Denomination List */}
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Denominations
                </Text>
                {denominations.map((denom) => {
                  const isSelected = selectedDenomination?.id === denom.id;
                  return (
                    <TouchableOpacity
                      key={denom.id}
                      onPress={() => handleSelectDenomination(denom)}
                      style={[
                        styles.denominationItem,
                        isSelected && {
                          backgroundColor: theme.colors.textSecondary + "20",
                          borderLeftWidth: 4,
                          borderLeftColor: theme.colors.textSecondary,
                        },
                      ]}
                    >
                      <View style={styles.denominationContent}>
                        <Text
                          style={[
                            styles.denominationName,
                            { color: theme.colors.text },
                            isSelected && { fontWeight: "bold" },
                          ]}
                        >
                          {denom.name}
                        </Text>
                        {denom.description && (
                          <Text
                            style={[
                              styles.denominationDescription,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {denom.description}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Text
                          style={[
                            styles.checkmark,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          ✓
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Period Selector for Catholic */}
              {isCatholic && (
                <View
                  style={[
                    styles.section,
                    { borderTopColor: theme.colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Catholic Hymn Period
                  </Text>
                  <View style={styles.periodButtons}>
                    <TouchableOpacity
                      onPress={() => handleSelectPeriod("new")}
                      style={[
                        styles.periodButton,
                        selectedPeriod === "new" && {
                          backgroundColor: theme.colors.textSecondary,
                        },
                        selectedPeriod !== "new" && {
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.periodButtonText,
                          selectedPeriod === "new"
                            ? { color: "#fff" }
                            : { color: theme.colors.text },
                        ]}
                      >
                        New Hymns
                      </Text>
                      {selectedPeriod === "new" && (
                        <Text style={styles.periodCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSelectPeriod("old")}
                      style={[
                        styles.periodButton,
                        selectedPeriod === "old" && {
                          backgroundColor: theme.colors.textSecondary,
                        },
                        selectedPeriod !== "old" && {
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.periodButtonText,
                          selectedPeriod === "old"
                            ? { color: "#fff" }
                            : { color: theme.colors.text },
                        ]}
                      >
                        Old Hymns
                      </Text>
                      {selectedPeriod === "old" && (
                        <Text style={styles.periodCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Current Selection Display */}
              {selectedDenomination && (
                <View
                  style={[
                    styles.currentSelection,
                    { backgroundColor: theme.colors.card },
                  ]}
                >
                  <Text
                    style={[
                      styles.currentSelectionLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Currently Selected:
                  </Text>
                  <Text
                    style={[
                      styles.currentSelectionText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {selectedDenomination.name}
                    {isCatholic && selectedPeriod
                      ? ` (${selectedPeriod === "new" ? "New" : "Old"})`
                      : ""}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flexDirection: "row",
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "android" ? 20 : 50,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
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
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  denominationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 0,
  },
  denominationContent: {
    flex: 1,
  },
  denominationName: {
    fontSize: 16,
    marginBottom: 4,
  },
  denominationDescription: {
    fontSize: 12,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },
  periodButtons: {
    gap: 12,
  },
  periodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  periodCheckmark: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  currentSelection: {
    padding: 16,
    borderRadius: 12,
    marginTop: "auto",
    marginBottom: 16,
  },
  currentSelectionLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentSelectionText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
