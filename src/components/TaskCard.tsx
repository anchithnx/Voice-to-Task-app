import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../models/task';

interface TaskCardProps {
  task: Task;
  onDelete: () => void;
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  const details = [
    task.date ? `Date: ${task.date}` : null,
    task.time ? `Time: ${task.time}` : null,
  ]
    .filter(Boolean)
    .join('  •  ');

  return (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{task.task}</Text>
        {details ? <Text style={styles.subtitle}>{details}</Text> : null}
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  deleteButton: { paddingHorizontal: 10, paddingVertical: 6 },
  deleteText: { color: '#d33', fontSize: 13, fontWeight: '500' },
});
