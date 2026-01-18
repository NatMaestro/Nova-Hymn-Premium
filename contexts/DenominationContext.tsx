import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Denomination {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  hymn_count?: number;
}

interface DenominationContextType {
  selectedDenomination: Denomination | null;
  selectedPeriod: "new" | "old" | null;
  denominations: Denomination[];
  isLoading: boolean;
  setSelectedDenomination: (denomination: Denomination | null) => void;
  setSelectedPeriod: (period: "new" | "old" | null) => void;
  refreshDenominations: () => Promise<void>;
}

const DenominationContext = createContext<DenominationContextType | undefined>(
  undefined
);

const STORAGE_KEY = "selected_denomination";
const PERIOD_STORAGE_KEY = "selected_hymn_period";

export const DenominationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedDenomination, setSelectedDenominationState] =
    useState<Denomination | null>(null);
  const [selectedPeriod, setSelectedPeriodState] = useState<
    "new" | "old" | null
  >(null);
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSelection();
    refreshDenominations();
  }, []);

  const loadStoredSelection = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const storedPeriod = await AsyncStorage.getItem(PERIOD_STORAGE_KEY);
      
      if (stored) {
        const denom = JSON.parse(stored);
        setSelectedDenominationState(denom);
        console.log("Loaded stored denomination:", denom);
      } else {
        console.log("No stored denomination found");
      }
      
      if (storedPeriod) {
        setSelectedPeriodState(storedPeriod as "new" | "old");
        console.log("Loaded stored period:", storedPeriod);
      }
    } catch (error) {
      console.error("Error loading stored denomination:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDenominations = async () => {
    try {
      const { getDenominations } = await import("@/lib/api");
      const fetched = await getDenominations();
      if (fetched && fetched.length > 0) {
        setDenominations(fetched);
        console.log("✅ Fetched denominations from backend:", fetched);
        
        // Auto-select first denomination if none is selected
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          const firstDenom = fetched[0];
          setSelectedDenominationState(firstDenom);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(firstDenom));
          console.log("✅ Auto-selected first denomination:", firstDenom);
          
          // If it's Catholic, also set default period to "new"
          if (firstDenom.slug === "catholic") {
            const storedPeriod = await AsyncStorage.getItem(PERIOD_STORAGE_KEY);
            if (!storedPeriod) {
              setSelectedPeriodState("new");
              await AsyncStorage.setItem(PERIOD_STORAGE_KEY, "new");
              console.log("✅ Auto-selected period: new");
            }
          }
        }
      } else {
        // If backend returns empty array, use defaults
        setDefaultDenominations();
      }
    } catch (error: any) {
      // Silently fallback to default denominations if backend is unavailable
      // This is expected when backend is not running or network is unavailable
      if (__DEV__) {
        console.warn("Backend unavailable, using default denominations:", error.message || "Network error");
      }
      setDefaultDenominations();
    }
  };

  const setDefaultDenominations = () => {
    const defaultDenominations: Denomination[] = [
      {
        id: 1,
        name: "Catholic",
        slug: "catholic",
        description: "Catholic Church Hymns",
        is_active: true,
        display_order: 1,
      },
      {
        id: 2,
        name: "Methodist",
        slug: "methodist",
        description: "Methodist Church Hymns",
        is_active: true,
        display_order: 2,
      },
      {
        id: 3,
        name: "Baptist",
        slug: "baptist",
        description: "Baptist Church Hymns",
        is_active: true,
        display_order: 3,
      },
    ];
    setDenominations(defaultDenominations);
  };

  const setSelectedDenomination = async (
    denomination: Denomination | null
  ) => {
    setSelectedDenominationState(denomination);
    if (denomination) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(denomination));
      // Reset period if switching to non-Catholic denomination
      if (denomination.slug !== "catholic") {
        setSelectedPeriod(null);
        await AsyncStorage.removeItem(PERIOD_STORAGE_KEY);
      }
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(PERIOD_STORAGE_KEY);
    }
  };

  const setSelectedPeriod = async (period: "new" | "old" | null) => {
    setSelectedPeriodState(period);
    if (period) {
      await AsyncStorage.setItem(PERIOD_STORAGE_KEY, period);
    } else {
      await AsyncStorage.removeItem(PERIOD_STORAGE_KEY);
    }
  };

  const contextValue: DenominationContextType = {
    selectedDenomination,
    selectedPeriod,
    denominations,
    isLoading,
    setSelectedDenomination,
    setSelectedPeriod,
    refreshDenominations,
  };

  return (
    <DenominationContext.Provider value={contextValue}>
      {children}
    </DenominationContext.Provider>
  );
};

export const useDenomination = () => {
  const context = useContext(DenominationContext);
  if (context === undefined) {
    throw new Error(
      "useDenomination must be used within a DenominationProvider"
    );
  }
  return context;
};

