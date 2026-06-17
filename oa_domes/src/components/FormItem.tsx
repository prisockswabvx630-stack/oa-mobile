import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FormItemProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function FormItem({ label, required = false, children }: FormItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  required: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 2,
  },
});
