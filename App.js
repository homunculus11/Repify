import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';

export default function App() {
  const [started, setStarted] = useState(false);
  const [count, setCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Requesting camera permission...');
  const motionState = useRef('up');
  const subscription = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [modelReady, setModelReady] = useState(false);
  const poseModel = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const baselineDistance = useRef(null);
  const poseState = useRef('up');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      if (permission && permission.status !== 'granted') {
        requestPermission();
      }
      return;
    }

    setStatusMessage('Loading AI model...');
    const loadModel = async () => {
      try {
        await tf.ready();
        await tf.setBackend('webgl');
        const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        });
        poseModel.current = detector;
        setModelReady(true);
        setStatusMessage('AI ready. Place your body in frame and press Start.');
      } catch (error) {
        console.error(error);
        setStatusMessage('Unable to load pose model.');
      }
    };

    loadModel();
  }, [permission, requestPermission]);

  useEffect(() => {
    if (!started || Platform.OS === 'web') {
      if (subscription.current) {
        subscription.current.remove();
        subscription.current = null;
      }
      return;
    }

    Accelerometer.setUpdateInterval(100);
    subscription.current = Accelerometer.addListener(({ y }) => {
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

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const startVideo = async () => {
      try {
        const facingMode = facing === 'front' ? 'user' : 'environment';
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('Webcam error:', error);
        setStatusMessage('Unable to access webcam.');
      }
    };

    startVideo();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [facing]);

  useEffect(() => {
    if (!started || Platform.OS !== 'web' || !modelReady || !poseModel.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const detectPose = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detectPose);
        return;
      }

      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const poses = await poseModel.current.estimatePoses(video, {
        flipHorizontal: facing === 'front',
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (poses.length > 0) {
        const pose = poses[0];
        drawPose(pose, ctx);

        const leftShoulder = pose.keypoints.find((k) => k.name === 'left_shoulder');
        const rightShoulder = pose.keypoints.find((k) => k.name === 'right_shoulder');
        const leftHip = pose.keypoints.find((k) => k.name === 'left_hip');
        const rightHip = pose.keypoints.find((k) => k.name === 'right_hip');

        if (
          leftShoulder?.score > 0.4 &&
          rightShoulder?.score > 0.4 &&
          leftHip?.score > 0.4 &&
          rightHip?.score > 0.4
        ) {
          const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
          const avgHipY = (leftHip.y + rightHip.y) / 2;
          const normalizedDistance = (avgShoulderY - avgHipY) / video.videoHeight;

          if (baselineDistance.current === null) {
            baselineDistance.current = normalizedDistance;
          }

          const downThreshold = baselineDistance.current + 0.08;
          const upThreshold = baselineDistance.current + 0.035;

          if (poseState.current === 'up' && normalizedDistance > downThreshold) {
            poseState.current = 'down';
            setStatusMessage('Down position detected. Push up now.');
          } else if (poseState.current === 'down' && normalizedDistance < upThreshold) {
            poseState.current = 'up';
            setCount((prev) => prev + 1);
            setStatusMessage('Rep counted! Keep going.');
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectPose);
    };

    detectPose();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [started, modelReady, facing]);

  const drawPose = (pose, ctx) => {
    ctx.drawImage(videoRef.current, 0, 0, ctx.canvas.width, ctx.canvas.height);
    const connections = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle'],
    ];

    pose.keypoints.forEach((keypoint) => {
      if (keypoint.score > 0.4) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
    });

    connections.forEach(([start, end]) => {
      const a = pose.keypoints.find((keypoint) => keypoint.name === start);
      const b = pose.keypoints.find((keypoint) => keypoint.name === end);
      if (a?.score > 0.4 && b?.score > 0.4) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  const handleStartPause = () => {
    const nextValue = !started;
    if (nextValue) {
      baselineDistance.current = null;
      poseState.current = 'up';
      motionState.current = 'up';
      setStatusMessage(Platform.OS === 'web' ? 'Starting pose tracking...' : 'Counting pushups. Keep phone stable!');
    } else {
      setStatusMessage('Paused. Tap Start to resume.');
    }
    setStarted(nextValue);
  };

  const renderWeb = () => {
    return (
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          <video ref={videoRef} autoPlay playsInline muted style={styles.camera} />
          <canvas ref={canvasRef} style={styles.camera} />
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
                  onPress={handleStartPause}
                >
                  <Text style={styles.buttonText}>{started ? 'Pause' : 'Start'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonReset]}
                  onPress={() => {
                    setCount(0);
                    baselineDistance.current = null;
                    poseState.current = 'up';
                    setStatusMessage('Counter reset. Tap Start when ready.');
                  }}
                >
                  <Text style={styles.buttonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCamera]}
                  onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
                >
                  <Text style={styles.buttonText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (Platform.OS === 'web') {
    return renderWeb();
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
        <CameraView style={styles.camera} facing={facing} />
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
                onPress={handleStartPause}
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
              <TouchableOpacity
                style={[styles.button, styles.buttonCamera]}
                onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
              >
                <Text style={styles.buttonText}>Camera</Text>
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
    width: '100%',
    height: '100%',
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
  buttonCamera: {
    backgroundColor: '#4a90e2',
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
