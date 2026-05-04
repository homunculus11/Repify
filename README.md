# Pushup Counter

A simple Expo mobile app that shows a camera preview and counts pushups with AI-powered pose detection.

## Features

- **AI Pose Detection**: Uses TensorFlow.js and MoveNet for accurate pushup counting by detecting body pose and movement.
- **Visual Feedback**: Draws lines and keypoints on the body for real-time pose recognition.
- **Fallback Mode**: Uses accelerometer on mobile devices when AI is not available.
- **Cross-Platform**: Works on web (with AI), iOS, and Android.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start Expo:
   ```bash
   npm start
   ```
3. Open on a phone or emulator with Expo Go, or on web for AI features.

## How it works

- On web: Uses camera API with TensorFlow.js MoveNet model to detect pose keypoints and count pushups based on shoulder movement.
- On mobile: Uses device accelerometer for basic motion detection (fallback).

## AI Integration

The app integrates AI for pushup counting using:
- **TensorFlow.js**: For running machine learning models in JavaScript.
- **MoveNet**: Lightweight pose detection model that identifies body keypoints.
- **Real-time Processing**: Processes camera frames to track shoulder position and detect up/down motion.

Keypoints detected include shoulders, elbows, hips, knees, etc., with lines drawn to visualize the pose.
