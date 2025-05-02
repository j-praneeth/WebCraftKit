# Facial Expression Analysis for Mock Interviews

This document explains how to set up and use the facial expression analysis feature in the mock interview platform.

## Overview

The facial expression analysis system uses face-api.js to detect and analyze users' facial expressions during mock interviews. This provides valuable feedback about how candidates present themselves emotionally during interviews.

Key features:
- Real-time facial expression detection
- Emotion metrics display (neutral, happy, sad, fearful, etc.)
- Confidence level calculation
- Emotional feedback during interviews

## Setup Instructions

### 1. Install Dependencies

The facial expression analysis requires face-api.js. This dependency has been added to package.json, so run:

```bash
npm install
```

### 2. Download Face-API.js Models

We've created a script to download the necessary model files. Run:

```bash
npm run setup:face-api
```

This will download the model files to the `public/models` directory. These models are required for facial expression detection.

### 3. Ensure Browser Permissions

The facial expression analysis requires camera access. Make sure your application requests and receives the appropriate permissions from users.

## Using the Facial Expression Analysis

During mock interviews, the system will:

1. Detect the user's face using their webcam
2. Analyze expressions in real-time
3. Display an emotion dashboard showing:
   - Current emotional state
   - Confidence level
   - Detailed emotion metrics

Users can toggle the analysis display by clicking the "Hide Analysis" / "Show Analysis" button.

## Implementation Details

The facial expression analysis is implemented in the following components:

- `FacialExpressionAnalyzer.tsx`: Core component that handles webcam access and emotion detection
- `EmotionDisplay.tsx`: Visual component that displays emotion metrics
- `VideoInterviewSimulator.tsx`: Main interview component that integrates these features

The system also collects emotion data throughout the interview and sends it to the server for storage. This data is used to provide feedback in the post-interview analysis.

## Privacy Considerations

Important privacy notes:

- Facial analysis happens entirely in the browser - no video is sent to the server
- Only aggregated emotion data is stored, not actual images or video
- Users can disable the analysis at any time
- Clear messaging about camera usage is provided

## Troubleshooting

If you encounter issues with the facial expression analysis:

1. **Models not loading**: Make sure you've run the setup script and the models are in the correct location.
2. **Camera access denied**: Check browser permissions.
3. **Performance issues**: Face detection can be CPU-intensive; adjust detection interval if needed.
4. **Detection accuracy**: Good lighting is crucial for accurate detection.

## Technical Notes

- The facial detection runs on a throttled interval (500ms) to improve performance
- The system uses TinyFaceDetector for efficient detection
- Emotion confidence is calculated as: `(neutral * 0.2 + happy * 0.8) * 100`
- Supported expressions: neutral, happy, sad, angry, fearful, surprised, disgusted 