import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  StyleSheet,
} from "react-native";
import { useDenomination } from "@/contexts/DenominationContext";
import { useTheme } from "@/contexts/ThemeContext";

interface DenominationSelectorProps {
  variant?: "button" | "inline";
  showPeriodSelector?: boolean;
}

export default function DenominationSelector({
  variant = "button",
  showPeriodSelector = true,
}: DenominationSelectorProps) {
  const {
    selectedDenomination,
    selectedPeriod,
    denominations,
    setSelectedDenomination,
    setSelectedPeriod,
  } = useDenomination();
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const isCatholic = selectedDenomination?.slug === "catholic";

  const handleSelectDenomination = (denomination: any) => {
    setSelectedDenomination(denomination);
    if (denomination.slug !== "catholic") {
      setSelectedPeriod(null);
    }
    setModalVisible(false);
  };

  const getDisplayText = () => {
    if (!selectedDenomination) return "Select Denomination";
    let text = selectedDenomination.name;
    if (isCatholic && selectedPeriod) {
      text += ` (${selectedPeriod === "new" ? "New" : "Old"})`;
    }
    return text;
  };

  if (variant === "inline") {
    return (
      <View style={styles.inlineContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inlineScrollContent}
        >
          {denominations.map((denom) => {
            const isSelected = selectedDenomination?.id === denom.id;
            return (
              <TouchableOpacity
                key={denom.id}
                onPress={() => handleSelectDenomination(denom)}
                style={[
                  styles.inlineButton,
                  isSelected && styles.inlineButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.inlineButtonText,
                    isSelected && styles.inlineButtonTextSelected,
                  ]}
                >
                  {denom.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Period selector for Catholic */}
        {isCatholic && showPeriodSelector && (
          <View style={styles.periodContainer}>
            <TouchableOpacity
              onPress={() => setSelectedPeriod("new")}
              style={[
                styles.periodButton,
                selectedPeriod === "new" && styles.periodButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === "new" && styles.periodButtonTextSelected,
                ]}
              >
                New
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedPeriod("old")}
              style={[
                styles.periodButton,
                selectedPeriod === "old" && styles.periodButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === "old" && styles.periodButtonTextSelected,
                ]}
              >
                Old
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            { color: theme.colors.text },
          ]}
        >
          {getDisplayText()}
        </Text>
        <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>
          ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, { color: theme.colors.text }]}
              >
                Select Denomination
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {denominations.map((denom) => {
                const isSelected = selectedDenomination?.id === denom.id;
                return (
                  <TouchableOpacity
                    key={denom.id}
                    onPress={() => handleSelectDenomination(denom)}
                    style={[
                      styles.modalItem,
                      isSelected && {
                        backgroundColor: theme.colors.primary + "20",
                      },
                    ]}
                  >
                    <View style={styles.modalItemContent}>
                      <Text
                        style={[
                          styles.modalItemText,
                          { color: theme.colors.text },
                          isSelected && { fontWeight: "bold" },
                        ]}
                      >
                        {denom.name}
                      </Text>
                      {denom.description && (
                        <Text
                          style={[
                            styles.modalItemDescription,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {denom.description}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Text style={[styles.checkmark, { color: theme.colors.primary }]}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Period selector for Catholic */}
            {isCatholic && showPeriodSelector && (
              <View
                style={[
                  styles.periodSelector,
                  { borderTopColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[styles.periodLabel, { color: theme.colors.text }]}
                >
                  Select Period:
                </Text>
                <View style={styles.periodButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPeriod("new");
                      setModalVisible(false);
                    }}
                    style={[
                      styles.periodButtonModal,
                      selectedPeriod === "new" && {
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.periodButtonTextModal,
                        selectedPeriod === "new" && { color: "#fff" },
                        { color: theme.colors.text },
                      ]}
                    >
                      New Hymns
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPeriod("old");
                      setModalVisible(false);
                    }}
                    style={[
                      styles.periodButtonModal,
                      selectedPeriod === "old" && {
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.periodButtonTextModal,
                        selectedPeriod === "old" && { color: "#fff" },
                        { color: theme.colors.text },
                      ]}
                    >
                      Old Hymns
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Button variant
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 180,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  chevron: {
    fontSize: 12,
    marginLeft: 8,
  },

  // Inline variant
  inlineContainer: {
    marginVertical: 8,
  },
  inlineScrollContent: {
    paddingHorizontal: 5,
    gap: 8,
  },
  inlineButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F6F1DA",
    marginRight: 8,
  },
  inlineButtonSelected: {
    backgroundColor: "#071c49",
  },
  inlineButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#062958",
  },
  inlineButtonTextSelected: {
    color: "#fff",
  },
  periodContainer: {
    flexDirection: "row",
    marginTop: 12,
    paddingHorizontal: 5,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F6F1DA",
    marginRight: 8,
  },
  periodButtonSelected: {
    backgroundColor: "#0B489A",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#062958",
  },
  periodButtonTextSelected: {
    color: "#fff",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: "70%",
    paddingBottom: Platform.OS === "android" ? 20 : 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E4",
  },
  modalTitle: {
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
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    marginBottom: 4,
  },
  modalItemDescription: {
    fontSize: 12,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: "bold",
  },
  periodSelector: {
    padding: 20,
    borderTopWidth: 1,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: "row",
    gap: 12,
  },
  periodButtonModal: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E4E4",
    alignItems: "center",
  },
  periodButtonTextModal: {
    fontSize: 14,
    fontWeight: "600",
  },
});


