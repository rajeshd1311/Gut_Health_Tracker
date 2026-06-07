# RCA: Time Picker Non-Responsive (Arrows + Text Input)

**Date:** 2026-06-07  
**Symptoms:** Tapping the up/down arrows on the time picker has no visible effect; the time value field cannot be edited by typing.

---

## Root Causes (ranked by confidence)

---

### Cause 1 — Backdrop `Pressable` covers the card and intercepts all pointer events
**Confidence: 95%**  
**Status: FIXED in this session**

The picker modal renders two siblings inside `modalOuter`:

```
modalOuter (flex container)
  ├── backdrop  (position: absolute, covers 100% of screen)
  └── pickerCard  (normal flex child, no z-index)
```

In CSS stacking order, `position: absolute` elements are painted **after** and therefore sit **on top of** elements in normal flow (static positioning). This means the backdrop `Pressable` visually and for hit-testing purposes sits **above** the `pickerCard`. Every tap on an arrow button or the text input hits the backdrop first, which calls `onClose()`, closing the modal instantly. The user perceives this as "the button did nothing" because the modal disappears before any value change is rendered and when they re-open it the time is unchanged.

**Why did this work before?**  
The original overlay code had `zIndex: 1` on `pickerCard`, explicitly promoting it above the backdrop. That line was removed when switching from a custom `position: fixed` overlay to the React Native `Modal` component, wrongly assuming the Modal's own stacking context would handle internal ordering automatically. It does not.

**Why do the Jest tests still pass?**  
JSDOM (Jest's DOM environment) dispatches pointer events based on the React component tree, not CSS stacking/painting order. Tests fire `fireEvent.press` directly on the target element regardless of what is visually on top. This is a classic case of tests passing while visual behaviour is broken.

**Fix:** Add `zIndex: 1` to the `pickerCard` style in `DateTimePicker.tsx`.

---

### Cause 2 — The dist bundle was not rebuilt after source changes
**Confidence: 85%**  
**Status: FIXED in this session**

The `dist/` folder contains a pre-compiled bundle served at the Bolt preview URL. Changing source `.tsx` files does **not** automatically update this bundle — `npm run build:web` must be run explicitly. Between sessions the `.npmrc` file (which provides `legacy-peer-deps=true` to unblock the peer dependency conflict in this project) was lost, causing `npm install` to fail and consequently preventing any rebuild. The bundle served to the browser therefore pre-dated the TextInput and Modal changes, so the user was seeing the original broken behaviour regardless of source-file correctness.

**Fix:**  
1. Recreate `.npmrc` with `legacy-peer-deps=true`.  
2. Run `npm run build:web` to regenerate the bundle with the current source.

---

### Cause 3 — `pointerEvents` behaviour in react-native-web's `Modal`
**Confidence: 35%**  
**Status: Deferred — address only if Causes 1 and 2 do not fully resolve the issue**

react-native-web's `Modal` renders into a portal appended to `document.body`. Depending on the installed version, `Pressable` elements inside a Modal can have inconsistent `cursor` and `pointer-events` CSS applied by the framework, leading to intermittent non-responsiveness. This would be a contributing factor rather than the sole root cause.

**Fix (if needed):** Explicitly set `pointerEvents="box-none"` on `modalOuter` and ensure `pickerCard` has `pointerEvents="auto"`.

---

### Cause 4 — Horizontal `ScrollView` for day chips intercepting tap gestures
**Confidence: 20%**  
**Status: Deferred**

A horizontal `ScrollView` translates to a `div` with `overflow-x: scroll` on web. React Native Web attaches pointer-capture listeners to `ScrollView` to handle swipe detection; these can occasionally swallow short taps before they are recognised as clicks. This would affect only the day chips, not the time spinners, so it cannot explain the full scope of the reported bug.

**Fix (if needed):** Replace `ScrollView` with a plain `View` using `overflow: 'scroll'` style directly, or wrap each chip's `Pressable` with `onStartShouldSetResponder={() => true}`.

---

### Cause 5 — Controlled `TextInput` re-render loop preventing typing
**Confidence: 15%**  
**Status: Deferred**

A controlled `TextInput` (with both `value` and `onChangeText`) on react-native-web can enter a state where React's reconciliation and the browser's native `input` state diverge, making the field appear frozen. This affects only typing, not arrow buttons, so it cannot be the sole cause of both reported symptoms.

**Fix (if needed):** Convert to an uncontrolled input pattern using `defaultValue` + a `ref`, or add `nativeID` and explicit `key` to force clean remounts when the modal opens.

---

## Decision Tree for Future Debugging

```
Arrows AND text input both broken?
  └── YES → Cause 1 (backdrop z-index) or Cause 2 (stale bundle)
        └── Does tapping an arrow close the modal?
              ├── YES → Cause 1 confirmed (backdrop intercept)
              └── NO  → Cause 2 likely (stale bundle, old Text display)

Only text input broken, arrows work?
  └── Cause 5 (controlled input)

Only day chips broken, time spinners work?
  └── Cause 4 (ScrollView swallowing taps)

Everything works in tests but broken in browser?
  └── Cause 3 (react-native-web Modal pointer-events) or Cause 1
```
