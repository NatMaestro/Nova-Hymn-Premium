import React, { useRef } from 'react';
import { View, TouchableOpacity, GestureResponderEvent, LayoutChangeEvent } from 'react-native';

interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onSlidingComplete: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  disabled?: boolean;
}

export default function CustomSlider({
  value,
  minimumValue,
  maximumValue,
  onSlidingComplete,
  minimumTrackTintColor = '#062958',
  maximumTrackTintColor = '#E4E4E4',
  thumbTintColor = '#062958',
  disabled = false,
}: CustomSliderProps) {
  const trackWidth = useRef(0);

  const percentage = maximumValue > minimumValue && maximumValue > 0
    ? Math.max(0, Math.min(100, ((value - minimumValue) / (maximumValue - minimumValue)) * 100))
    : 0;

  const handleLayout = (event: LayoutChangeEvent) => {
    trackWidth.current = event.nativeEvent.layout.width;
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled || maximumValue === 0 || trackWidth.current === 0) return;
    
    const { locationX } = event.nativeEvent;
    const newPercentage = Math.max(0, Math.min(100, (locationX / trackWidth.current) * 100));
    const newValue = minimumValue + (newPercentage / 100) * (maximumValue - minimumValue);
    
    onSlidingComplete(newValue);
  };

  return (
    <View 
      className="flex-1 h-2 relative"
      onLayout={handleLayout}
    >
      {/* Track */}
      <View 
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: maximumTrackTintColor }}
      />
      
      {/* Filled track */}
      <View 
        className="absolute left-0 top-0 bottom-0 rounded-full"
        style={{ 
          width: `${percentage}%`,
          backgroundColor: minimumTrackTintColor 
        }}
      />
      
      {/* Thumb */}
      <View
        className="absolute -top-2 -bottom-2 justify-center items-center"
        style={{ 
          left: `${percentage}%`,
          marginLeft: -8,
          width: 16,
        }}
      >
        <View
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: disabled ? '#999' : thumbTintColor }}
        />
      </View>
      
      {/* Touch area */}
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={1}
        className="absolute inset-0"
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
}

