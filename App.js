import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';

export default function App() {
  const [started, setStarted] = useState(false);
  const [count, setCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Requesting camera permission...');
  const motionState = useRef('up');
  const subscription = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (Platform.OS === 'web') {
      setStatusMessage('Camera not available on web. Use Expo Go on mobile.');
      return;
    }

    if (permission && permission.status !== 'granted') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (!started) {
      if (subscription.current) {
        subscription.current.remove();
        subscription.current = null;
      }
      return;
    }

    Accelerometer.setUpdateInterval(100);
    subscription.current = Accelerometer.addListener((data) => {
      const y = data.y;
      const threshold = 0.55;

      if (motionState.current === 'up' && y < -threshold) {
        motionState.current = 'down';
      }

      if (motionState.current === 'down' && y > threshold) {
        motionState.current = 'up';
        setCount((prev) => prev + 1);
      }
    });

    return () => {
      if (subscription.current) {
        subscription.current.remove();
        subscription.current = null;
      }
    };
  }, [started]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Camera not available on web. Use Expo Go on mobile.</Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Camera permission is required.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="back" />
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.counterBox}>
            <Text style={styles.counterLabel}>Pushups</Text>
            <Text style={styles.counterValue}>{count}</Text>
          </View>
          <View style={styles.footer}>
            <Text style={styles.statusText}>{statusMessage}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, started ? styles.buttonStop : styles.buttonStart]}
                onPress={() => {
                  setStarted((value) => !value);
                  setStatusMessage(started ? 'Paused. Tap Start to resume.' : 'Counting pushups. Keep phone stable!');
                }}
              >
                <Text style={styles.buttonText}>{started ? 'Pause' : 'Start'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonReset]}
                onPress={() => {
                  setCount(0);
                  motionState.current = 'up';
                  setStatusMessage('Counter reset. Tap Start when ready.');
                }}
              >
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingHorizontal: 18,
    paddingBottom: 28,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  counterBox: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },
  counterLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.9,
  },
  counterValue: {
    color: '#00ff99',
    fontSize: 54,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  buttonStart: {
    backgroundColor: '#38b6ff',
  },
  buttonStop: {
    backgroundColor: '#ff6b6b',
  },
  buttonReset: {
    backgroundColor: '#828282',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  errorText: {
    color: '#ff6666',
    fontSize: 18,
    textAlign: 'center',
  },
});
