# Smart Logging: Failure Modes & Risk Analysis

**Last Updated:** June 7, 2026

This document identifies the critical ways in which the voice-based, image-based, and barcode-based logging features for **GutSense** could fail. Since digestive trigger tracking requires higher precision than general calorie tracking, these failure modes focus on data integrity, user behavior, technical limitations, and cost.

---

## 1. Algorithmic & Data Integrity Failures

### A. The "Invisible Ingredient" Blindspot
* **The Failure:** Vision models (like Gemini) can only analyze surface-level items. They cannot detect hidden triggers that are mixed, emulsified, or powdered into foods (e.g., garlic powder, onion powder, honey, butter/cream in a sauce, wheat flour in a gravy, or artificial sweeteners in a beverage).
* **Why it kills the app:** IBS flare-ups are often triggered by trace amounts of these ingredients. If a user uploads a photo of "Grilled Chicken with Sauce," the model logs it as safe, missing the garlic and butter. The user suffers symptoms, but the correlation engine ([analyzeCorrelations](file:///Users/rajeshdutta/Documents/AI Experiments/Gut_Health_Tracker/services/correlations.ts#L31)) is fed incorrect data. It will either fail to find the trigger or generate false positives for other ingredients.

### B. Directional Accuracy "Hallucinations"
* **The Failure:** Vision LLMs are highly convincing but frequently hallucinate details. For example, a gluten-free bread slice and a standard wheat bread slice look identical to a camera. A cup of soy milk looks identical to cow's milk.
* **Why it kills the app:** If the model guesses dairy/gluten incorrectly and logs it, the correlation database gets polluted. In IBS tracking, a false negative (missing a trigger) is just as bad as a false positive (flagging a safe food).

---

## 2. User Experience (UX) & Behavioral Failures

### C. The "Bypass Neglect" Loop
* **The Failure:** The "optional confirmation" design lets users save logs without verifying them. Due to friction-avoidance, users will swipe away or ignore the confirmation prompt 90% of the time.
* **Why it kills the app:** Over time, the database accumulates unverified, directionally guessed meal entries. When the user checks the Insights tab after two weeks, the generated hypotheses will be inaccurate, leading to a loss of trust in the app.

### D. The "Correction Friction" Paradox
* **The Failure:** If the AI's guesses are wrong 30% of the time, the user has to manually correct the tags. The UX flow of deleting misidentified tags and searching for/adding correct ones is often *more* frustrating than logging manually from scratch.
* **Why it kills the app:** Users will find the smart feature annoying, stop using it, or uninstall the app due to perceived instability/unreliability.

---

## 3. Technical & Environmental Failures

### E. The "Restaurant Connection" Bottleneck
* **The Failure:** Most meal logging happens in social environments like restaurants, cafes, or dining halls. These places often have poor cellular service or crowded Wi-Fi. Sending a high-resolution image to a cloud vision API over a 3G/poor LTE connection will take 10+ seconds or time out.
* **Why it kills the app:** If the upload spins indefinitely, the user will close the app, resulting in a lost meal log.

### F. Noisy Environment Voice Failures
* **The Failure:** Restaurant ambient noise, clashing plates, background music, or nearby conversations interfere with native speech recognition.
* **Why it kills the app:** Garbage transcription outputs (e.g., transcribing *"spelt toast"* as *"spelt ghost"* or missing words entirely) make the local dictation unusable exactly when the user needs it most.

### G. Social Discomfort / Speech Stigma
* **The Failure:** IBS and bowel sensitivities carry social stigma. Dictating a meal log (e.g., *"large bowl of high-fiber beans, prune juice, and gluten-free bread"*) aloud in public or around friends is socially awkward.
* **Why it kills the app:** Voice logging will only be used at home, limiting its utility for restaurant meals (which are the most common source of symptom triggers).

---

## 4. Financial & Operational Failures

### H. The Multimodal API Bill
* **The Failure:** Passing images and custom parsing prompts to cloud LLMs (like Gemini) is expensive compared to standard text-only database queries. If a user logs 4 meals/drinks a day with photos, the monthly API cost per active user can quickly exceed the app's monetization limits.
* **Why it kills the app:** A bootstrapped or low-cost subscription model will become financially unsustainable if user growth scales API costs faster than revenue.
