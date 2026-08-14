import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import AudioRecorderPlayer, { AVEncodingOption } from 'react-native-audio-recorder-player';
import whisperService from '../services/whisperService';
import ollamaService from '../services/ollamaService';
import dbService from '../services/dbService';
import { Task } from '../models/task';
import TaskCard from '../components/TaskCard';

const audioRecorderPlayer = new AudioRecorderPlayer();

export default function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const recordingPathRef = useRef<string>('');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const result = await dbService.getAllTasks();
    setTasks(result);
  }

  async function requestMicPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  async function toggleRecording() {
    if (isRecording) {
      await stopAndProcess();
    } else {
      await startRecording();
    }
  }

  async function startRecording() {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      setStatus('Microphone permission denied');
      return;
    }

    const path = whisperService.getNextRecordingPath();
    recordingPathRef.current = path;

    await audioRecorderPlayer.startRecorder(path, {
      AVSampleRateKeyIOS: 16000,
      AVNumberOfChannelsKeyIOS: 1,
      AVFormatIDKeyIOS: AVEncodingOption.wav,
    });

    setIsRecording(true);
    setStatus('Listening...');
  }

  async function stopAndProcess() {
    await audioRecorderPlayer.stopRecorder();
    setIsRecording(false);
    setIsProcessing(true);
    setStatus('Transcribing...');

    try {
      const transcript = await whisperService.transcribe(recordingPathRef.current);

      setStatus('Extracting task details...');
      const task = await ollamaService.extractTask(transcript);

      await dbService.insertTask(task);
      await loadTasks();

      setStatus(`Saved: "${task.task}"`);
    } catch (e: any) {
      setStatus(`Error: ${e.message ?? e}`);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete(id?: number) {
    if (id == null) return;
    await dbService.deleteTask(id);
    await loadTasks();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Voice to Task</Text>
      <Text style={styles.status}>{status}</Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TaskCard task={item} onDelete={() => handleDelete(item.id)} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No tasks yet. Tap the mic to add one.</Text>
        }
        contentContainerStyle={{ paddingVertical: 8 }}
      />

      <TouchableOpacity
        style={[styles.fab, isRecording && styles.fabRecording]}
        onPress={toggleRecording}
        disabled={isProcessing}
      >
        <Text style={styles.fabText}>{isRecording ? '■' : '🎤'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: { fontSize: 22, fontWeight: '700', padding: 16, paddingBottom: 4 },
  status: { paddingHorizontal: 16, paddingBottom: 8, color: '#555' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a4ae0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabRecording: { backgroundColor: '#d33' },
  fabText: { fontSize: 26, color: '#fff' },
});
