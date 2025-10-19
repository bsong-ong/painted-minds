# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/87a60303-7bd1-4064-831a-9c397a92c9e6

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/87a60303-7bd1-4064-831a-9c397a92c9e6) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/87a60303-7bd1-4064-831a-9c397a92c9e6) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Mobile App Setup (Capacitor)

This app can be built as a native mobile app for iOS and Android using Capacitor. See [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md) for detailed setup instructions.

### Quick Start

1. **Export and Clone**: Export to GitHub and clone locally
2. **Install Dependencies**: `npm install`
3. **Add Platform**: 
   - iOS: `npx cap add ios`
   - Android: `npx cap add android`
4. **Configure Permissions** (Required for microphone features):
   - **Android**: Add microphone permissions to `android/app/src/main/AndroidManifest.xml`
   - **iOS**: Add microphone usage description to `ios/App/App/Info.plist`
5. **Build**: `npm run build`
6. **Sync**: `npx cap sync`
7. **Run**: Open in native IDE
   - iOS: `npx cap open ios` (requires Xcode on Mac)
   - Android: `npx cap open android` (requires Android Studio)

### Important Notes

- The CBT Assistant and Talk Buddy features require microphone access
- You must manually configure microphone permissions in native config files
- See [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md) for complete instructions with code examples
