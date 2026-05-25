# Voice Lifecycle And Timer

This file explains how voice sessions now start, stop, restart, and autosave.

## What Was Going Wrong

- Old voice sessions were not always fully cleaned before next mic tap.
- A second mic attempt could reuse stale listeners/instances and fail.
- Web and native behavior was mixed in one place, making lifecycle edge-cases hard.
- Autosave timer was 5 seconds but needed 2 seconds.

## Platform Detection

File: `src/services/voicePlatform.ts`

- If running native (Capacitor): uses `@capacitor-community/speech-recognition`
- Else on browser: uses Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- If neither exists: returns unsupported

## Voice Lifecycle (Simple Flow)

1. `startListening()`
2. Request/check permission
3. Start platform speech engine
4. Receive partial/final transcript callbacks
5. `stopListening()` or silence timeout
6. `cleanup()` removes listeners and closes session
7. State reset for next mic run

## Safe Restart Logic

Before every new start:

- stop old session
- abort old session
- cleanup old listeners/instance
- clear transcript and local session refs
- create a brand new session

This prevents duplicate recognition instances.

## Error Handling

Handled codes include:

- `PERMISSION_DENIED`
- `NO_SPEECH`
- `UNSUPPORTED_BROWSER`
- `ABORTED`
- `TIMEOUT`
- `DUPLICATE_START`

UI now shows friendlier messages for these states instead of one generic failure.

## App Background Behavior

- Background listener is attached in voice hook.
- When app goes to background (or tab hidden), active voice session is aborted and cleaned.

## Autosave Timer Change

- Dashboard voice autosave wait: `2` seconds
- Group voice autosave wait: `2` seconds
- Silence controller timeout for both flows is also set to `2000ms`
- New speech resets countdown again.

## Reset After Autosave

After voice processing completes and autosave triggers:

- transcript is cleared
- controller session status returns to idle
- next mic tap starts from clean state

## Quick Verification

1. Dashboard:
   - Speak expense
   - Wait 2 seconds
   - Verify autosave
2. Tap mic repeatedly:
   - Start/stop/start several times
   - No "Could not process voice input" loop
3. Group Expense:
   - Speak valid input
   - Wait 2 seconds
   - Verify autosave
4. Native build:
   - Test repeated sessions
   - Background app and resume
   - Voice should stop cleanly and start again
