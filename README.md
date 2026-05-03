# Pushup Counter

A simple Expo mobile app that shows a camera preview and counts pushups with a basic movement detector.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start Expo:
   ```bash
   npm start
   ```
3. Open on a phone or emulator with Expo Go.

## How it works

- The app requests camera permission and shows the live camera view.
- A simple motion detector uses the device accelerometer to infer pushups.
- The current count is displayed at the top of the screen.
