# Re:mind (KnowledgeVault)

An AI-powered personal knowledge journal. Capture quick thoughts, and Gemini automatically generates a summary and conceptual tags for each entry. A unique "Resurface" feature detects when a new thought is conceptually related to a past saved note and surfaces it in real time.

## Features
- **Firebase Authentication** — secure sign-in
- **Gemini-powered summarization & tagging** — every saved thought gets an auto-generated summary and 2-3 conceptual tags
- **Firestore storage** — entries persist per authenticated user
- **Resurface (original feature)** — as you type, the app checks past saved entries for genuine conceptual/topical overlap (not just shared keywords) and surfaces relevant past notes with a "This might be useful right now" card

## Tech Stack
- Firebase Auth
- Cloud Firestore
- Gemini API (via Google AI Studio)
- Google Cloud Secret Manager (see note below)

## Secure Key Management
The app is architected to retrieve the Gemini API key from Google Cloud Secret Manager at runtime — never hardcoded. Due to a GCP billing account verification delay outside the project's control, Secret Manager access could not be enabled in time for submission. The code attempts Secret Manager first and includes an explicit, logged fallback to an environment variable so the app remains functional; switching fully to Secret Manager requires no further code changes once the GCP billing issue resolves.

## Original Feature: Resurface
Unlike simple keyword search, Resurface uses Gemini to compare the conceptual meaning of a new draft against previously saved summaries and tags, filtering out shallow/literal word matches so it only surfaces genuinely related past thoughts.
