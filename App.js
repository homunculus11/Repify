import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { useFonts, Orbitron_600SemiBold } from '@expo-google-fonts/orbitron';
import { Rajdhani_500Medium, Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';

const RepContext = React.createContext({ repCount: 0, setRepCount: () => {} });

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const COLORS = {
  background: '#0b0c10',
  panel: '#141821',
  panelSoft: '#191f2b',
  accent: '#c62828',
  accentSoft: '#ff4c4c',
  textMain: '#f5f5f5',
  textSoft: '#a6adbb',
  gold: '#f1b24a',
};

export default function App() {
  const [repCount, setRepCount] = useState(0);
  const [fontsLoaded] = useFonts({
    Orbitron_600SemiBold,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
  });

  const repContextValue = useMemo(() => ({ repCount, setRepCount }), [repCount]);

  if (!fontsLoaded) {
    return (
      <LinearGradient colors={[COLORS.background, '#111827']} style={styles.screen}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.loadingText}>Loading Repify...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <RepContext.Provider value={repContextValue}>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: COLORS.accent,
            background: COLORS.background,
            card: COLORS.panel,
            text: COLORS.textMain,
            border: 'transparent',
            notification: COLORS.accentSoft,
          },
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="BattleSummary" component={BattleSummaryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </RepContext.Provider>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivitySelectionScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Select" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Workout"
        component={ActiveWorkoutScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Workout" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Rank" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ label, focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabIconText, focused && styles.tabIconTextActive]}>{label}</Text>
    </View>
  );
}

function LogoMark({ size = 34 }) {
  const logoSource = require('./assets/logo.png');
  return (
    <Image source={logoSource} style={{ width: size, height: size, resizeMode: 'contain' }} />
  );
}

function AppScreen({ children }) {
  return (
    <LinearGradient colors={['#0b0c10', '#111826', '#0b0c10']} style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

function Header({ title, subtitle }) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.logoRow}>
        <View style={styles.logoBadge}>
          <LogoMark size={34} />
        </View>
        <View>
          <Text style={styles.brandTitle}>REPIFY</Text>
          <Text style={styles.brandSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function HomeScreen({ navigation }) {
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header title="HOME" subtitle="Game Lobby" />
        <View style={styles.mapCard}>
          <View style={styles.mapGlow} />
          <View style={styles.mapGrid}>
            <View style={styles.mapLine} />
            <View style={styles.mapLine} />
            <View style={styles.mapLineWide} />
          </View>
          <View style={styles.mapPin}>
            <View style={styles.mapDot} />
          </View>
          <Text style={styles.mapTitle}>Sector 1: Iron Gym</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Activity')}>
          <Text style={styles.primaryButtonText}>START BATTLE</Text>
        </TouchableOpacity>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Mission</Text>
          <Text style={styles.panelValue}>Defeat the Bench Press Golem (5 reps)</Text>
        </View>
        <View style={styles.panel}>
          <View style={styles.panelRow}>
            <Text style={styles.panelTitle}>Mini-Feed</Text>
            <Text style={styles.panelLink}>View All</Text>
          </View>
          <Text style={styles.panelValue}>MuscleMark defeated Iron Twins (13 reps)</Text>
          <Text style={styles.panelValue}>Player (You) hit 12 reps</Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function ActivitySelectionScreen({ navigation }) {
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header title="ACTIVITY" subtitle="Selection" />
        <View style={styles.grid}>
          {['Pushups', 'Situps', 'Squats', 'Burpees'].map((item) => (
            <View key={item} style={[styles.gridCard, item === 'Pushups' && styles.gridCardActive]}>
              <Text style={styles.gridTitle}>{item}</Text>
              <Text style={styles.gridSubtitle}>Hard</Text>
            </View>
          ))}
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Current Enemy</Text>
          <Text style={styles.panelValue}>The Squat Bot</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Workout')}>
          <Text style={styles.primaryButtonText}>PROCEED</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppScreen>
  );
}

function ActiveWorkoutScreen({ navigation }) {
  const { setRepCount } = React.useContext(RepContext);
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
    setRepCount(count);
  }, [count, setRepCount]);

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
        drawPose(pose, ctx, video);

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

  const drawPose = (pose, ctx, video) => {
    ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);
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
        ctx.fillStyle = COLORS.accentSoft;
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
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
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

  const header = (
    <View style={styles.workoutHeader}>
      <View style={styles.logoRow}>
        <View style={styles.logoBadge}>
          <LogoMark size={32} />
        </View>
        <Text style={styles.workoutTitle}>PUSHUPS</Text>
      </View>
      <View style={styles.liveBadge}>
        <Text style={styles.liveBadgeText}>LIVE REP COUNT</Text>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <AppScreen>
        {header}
        <View style={styles.cameraShell}>
          <video ref={videoRef} autoPlay playsInline muted style={styles.camera} />
          <canvas ref={canvasRef} style={styles.camera} />
          <View style={styles.workoutOverlay} pointerEvents="box-none">
            <View style={styles.repCounterCard}>
              <Text style={styles.repCounterLabel}>REPS</Text>
              <Text style={styles.repCounterValue}>{count}</Text>
            </View>
            <View style={styles.workoutStatusCard}>
              <Text style={styles.statusText}>{statusMessage}</Text>
            </View>
            <View style={styles.workoutFooter}>
              <TouchableOpacity
                style={[styles.actionButton, started ? styles.actionStop : styles.actionStart]}
                onPress={handleStartPause}
              >
                <Text style={styles.actionButtonText}>{started ? 'PAUSE' : 'START'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionReset]}
                onPress={() => {
                  setCount(0);
                  baselineDistance.current = null;
                  poseState.current = 'up';
                  setStatusMessage('Counter reset. Tap Start when ready.');
                }}
              >
                <Text style={styles.actionButtonText}>RESET</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionGhost]}
                onPress={() => navigation.navigate('BattleSummary')}
              >
                <Text style={styles.actionButtonText}>FINISH</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AppScreen>
    );
  }

  if (!permission) {
    return (
      <AppScreen>
        <View style={styles.centered}>
          <Text style={styles.statusText}>Requesting camera permission...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!permission.granted) {
    return (
      <AppScreen>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Camera permission is required.</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      {header}
      <View style={styles.cameraShell}>
        <CameraView style={styles.camera} facing={facing} />
        <View style={styles.workoutOverlay} pointerEvents="box-none">
          <View style={styles.repCounterCard}>
            <Text style={styles.repCounterLabel}>REPS</Text>
            <Text style={styles.repCounterValue}>{count}</Text>
          </View>
          <View style={styles.workoutStatusCard}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
          <View style={styles.workoutFooter}>
            <TouchableOpacity
              style={[styles.actionButton, started ? styles.actionStop : styles.actionStart]}
              onPress={handleStartPause}
            >
              <Text style={styles.actionButtonText}>{started ? 'PAUSE' : 'START'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionReset]}
              onPress={() => {
                setCount(0);
                motionState.current = 'up';
                setStatusMessage('Counter reset. Tap Start when ready.');
              }}
            >
              <Text style={styles.actionButtonText}>RESET</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionGhost]}
              onPress={() => navigation.navigate('BattleSummary')}
            >
              <Text style={styles.actionButtonText}>FINISH</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.enemyCard}>
            <Text style={styles.enemyLabel}>DAMAGE</Text>
            <Text style={styles.enemyTitle}>GOBLIN BOSS</Text>
            <Text style={styles.enemySubtitle}>Each rep deals dynamic damage</Text>
          </View>
          <TouchableOpacity style={styles.cameraToggle} onPress={() => setFacing((v) => (v === 'back' ? 'front' : 'back'))}>
            <Text style={styles.cameraToggleText}>SWAP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppScreen>
  );
}

function BattleSummaryScreen({ navigation }) {
  const { repCount } = React.useContext(RepContext);
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header title="BATTLE" subtitle="Summary" />
        <View style={styles.victoryCard}>
          <Text style={styles.victoryTitle}>VICTORY</Text>
          <View style={styles.victoryRow}>
            <View style={styles.victoryStat}>
              <Text style={styles.victoryLabel}>REPS</Text>
              <Text style={styles.victoryValue}>{repCount}</Text>
            </View>
            <View style={styles.victoryStat}>
              <Text style={styles.victoryLabel}>EXP</Text>
              <Text style={styles.victoryValue}>+{repCount * 2}</Text>
            </View>
          </View>
          <View style={styles.victoryRow}>
            <View style={styles.victoryStat}>
              <Text style={styles.victoryLabel}>REP POWER</Text>
              <Text style={styles.victoryValue}>{repCount * 10}</Text>
            </View>
            <View style={styles.victoryStat}>
              <Text style={styles.victoryLabel}>ENEMY</Text>
              <Text style={styles.victoryValue}>GOBLIN</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Leaderboard' })}
          >
            <Text style={styles.primaryButtonText}>CONTINUE TO LEADERBOARD</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function LeaderboardScreen() {
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header title="LEADERBOARD" subtitle="Global" />
        <View style={styles.panel}>
          {[
            { name: 'MuscleMark', reps: 67, level: 30 },
            { name: 'Player (You)', reps: 48, level: 24 },
            { name: 'Bavarian', reps: 41, level: 20 },
            { name: 'Guber', reps: 33, level: 18 },
          ].map((entry, index) => (
            <View key={entry.name} style={styles.leaderRow}>
              <Text style={styles.leaderRank}>#{index + 1}</Text>
              <View style={styles.leaderBody}>
                <Text style={styles.leaderName}>{entry.name}</Text>
                <Text style={styles.leaderMeta}>{entry.reps} reps</Text>
              </View>
              <Text style={styles.leaderLevel}>Lv {entry.level}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function ProfileScreen() {
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header title="PROFILE" subtitle="Upgrades" />
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <LogoMark size={64} />
          </View>
          <Text style={styles.profileName}>Player</Text>
          <Text style={styles.profileMeta}>Level 24</Text>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Strength</Text>
              <Text style={styles.statValue}>+9</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Endurance</Text>
              <Text style={styles.statValue}>+6</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Stamina</Text>
              <Text style={styles.statValue}>+7</Text>
            </View>
          </View>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Inventory</Text>
          {['Steel Bicep Bracers', 'Steel Push Rims', 'Stamina Charm'].map((item) => (
            <Text key={item} style={styles.panelValue}>
              {item}
            </Text>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: COLORS.textMain,
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(198,40,40,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(198,40,40,0.45)',
    marginRight: 12,
  },
  brandTitle: {
    color: COLORS.textMain,
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 18,
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
  },
  headerTitle: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 14,
  },
  mapCard: {
    backgroundColor: COLORS.panel,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mapGlow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(198,40,40,0.2)',
  },
  mapGrid: {
    height: 140,
    justifyContent: 'space-between',
  },
  mapLine: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  mapLineWide: {
    height: 2,
    width: '70%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  mapPin: {
    position: 'absolute',
    top: 60,
    left: 60,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentSoft,
  },
  mapTitle: {
    marginTop: 16,
    color: COLORS.textMain,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: COLORS.textMain,
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 14,
    letterSpacing: 1,
  },
  panel: {
    backgroundColor: COLORS.panel,
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  panelTitle: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  panelValue: {
    color: COLORS.textMain,
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 16,
    marginBottom: 4,
  },
  panelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  panelLink: {
    color: COLORS.accentSoft,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gridCard: {
    width: '48%',
    backgroundColor: COLORS.panelSoft,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  gridCardActive: {
    borderColor: COLORS.accentSoft,
    backgroundColor: 'rgba(198,40,40,0.2)',
  },
  gridTitle: {
    color: COLORS.textMain,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
  },
  gridSubtitle: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 13,
  },
  workoutHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutTitle: {
    color: COLORS.textMain,
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 18,
  },
  liveBadge: {
    backgroundColor: 'rgba(198,40,40,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(198,40,40,0.6)',
  },
  liveBadgeText: {
    color: COLORS.textMain,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
  },
  cameraShell: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#05070b',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  workoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  repCounterCard: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  repCounterLabel: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
  },
  repCounterValue: {
    color: COLORS.accentSoft,
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 38,
  },
  workoutStatusCard: {
    alignSelf: 'center',
    backgroundColor: 'rgba(20,24,33,0.9)',
    padding: 12,
    borderRadius: 16,
  },
  statusText: {
    color: COLORS.textMain,
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 15,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.accentSoft,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
  },
  workoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionStart: {
    backgroundColor: COLORS.accent,
  },
  actionStop: {
    backgroundColor: '#303744',
  },
  actionReset: {
    backgroundColor: '#222836',
  },
  actionGhost: {
    backgroundColor: 'rgba(198,40,40,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(198,40,40,0.6)',
  },
  actionButtonText: {
    color: COLORS.textMain,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 13,
  },
  enemyCard: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20,24,33,0.92)',
    padding: 12,
    borderRadius: 14,
  },
  enemyLabel: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
  },
  enemyTitle: {
    color: COLORS.textMain,
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 14,
    marginTop: 4,
  },
  enemySubtitle: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
  },
  cameraToggle: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cameraToggleText: {
    color: COLORS.textMain,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
  },
  victoryCard: {
    backgroundColor: COLORS.panel,
    borderRadius: 24,
    padding: 22,
  },
  victoryTitle: {
    color: COLORS.accentSoft,
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  victoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  victoryStat: {
    flex: 1,
    backgroundColor: COLORS.panelSoft,
    marginHorizontal: 6,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  victoryLabel: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
  },
  victoryValue: {
    color: COLORS.textMain,
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 18,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  leaderRank: {
    width: 40,
    color: COLORS.gold,
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 14,
  },
  leaderBody: {
    flex: 1,
  },
  leaderName: {
    color: COLORS.textMain,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
  },
  leaderMeta: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
  },
  leaderLevel: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
  },
  profileCard: {
    backgroundColor: COLORS.panel,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 84,
    height: 84,
    borderRadius: 32,
    backgroundColor: 'rgba(198,40,40,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    color: COLORS.textMain,
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 18,
  },
  profileMeta: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statChip: {
    flex: 1,
    backgroundColor: COLORS.panelSoft,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statLabel: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
  },
  statValue: {
    color: COLORS.textMain,
    fontFamily: 'Orbitron_600SemiBold',
    fontSize: 16,
  },
  tabBar: {
    backgroundColor: '#0d0f14',
    borderTopWidth: 0,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabIcon: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  tabIconActive: {
    backgroundColor: 'rgba(198,40,40,0.2)',
  },
  tabIconText: {
    color: COLORS.textSoft,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 12,
  },
  tabIconTextActive: {
    color: COLORS.textMain,
  },
});
