# Voice-to-Text Feature

## Overview
The AI Assistant now includes voice-to-text functionality, allowing users to dictate their messages instead of typing them.

## Availability
Voice-to-text is available in the following plans:
- ✅ Plus Plan (₹2,999/month)
- ✅ Pro Plan (₹8,999/month)
- ✅ Business Plan (₹13,999/month)
- ❌ Free Plan (Not available)

## How to Use

### Starting Voice Recording
1. Click the microphone icon (🎤) next to the send button
2. Allow microphone access when prompted by your browser
3. The microphone button will turn red and pulse to indicate recording is active
4. Speak clearly into your microphone

### Stopping Voice Recording
1. Click the microphone icon again (now showing 🎤 with red background)
2. The recording will stop and your speech will be converted to text
3. The converted text will appear in the message input box
4. You can edit the text before sending if needed

## Technical Details

### Browser Compatibility
The voice-to-text feature uses the Web Speech API, which is supported in:
- ✅ Chrome/Chromium browsers
- ✅ Edge
- ✅ Safari (with webkit prefix)
- ❌ Firefox (limited support)

### Implementation
- Uses `MediaRecorder` API for audio capture
- Uses `SpeechRecognition` API for speech-to-text conversion
- Language: English (en-US)
- Real-time conversion after recording stops

### Permissions Required
- Microphone access must be granted by the user
- Browser will prompt for permission on first use

## User Experience

### Visual Feedback
- **Idle State**: Gray microphone icon with outline style
- **Recording State**: Red microphone icon with pulse animation
- **Toast Notifications**:
  - "🎤 Recording Started - Speak now..."
  - "🎤 Recording Stopped - Converting speech to text..."
  - Error messages for permission denied or unsupported browsers

### Error Handling
- **Microphone Access Denied**: Shows error message asking user to allow microphone access
- **Voice Recognition Failed**: Shows error message suggesting to try again
- **Browser Not Supported**: Shows error message indicating browser doesn't support voice recognition
- **Plan Restriction**: Shows upgrade prompt for free plan users

## Integration with Chat
- Voice-to-text works seamlessly with the existing chat interface
- Converted text is appended to any existing text in the input box
- Users can combine typing and voice input
- Voice input respects the same character limits as typed input

## Privacy & Security
- Audio is processed locally in the browser
- No audio data is sent to external servers
- Speech recognition uses browser's built-in capabilities
- Recording stops automatically when user clicks the button again

## Future Enhancements
- Support for multiple languages
- Continuous voice input mode
- Voice commands for chat actions
- Improved accuracy with custom vocabulary
