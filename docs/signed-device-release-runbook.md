# ShotLab Signed-Device and TestFlight Runbook

## Finalized product identity

- App name: ShotLab
- Bundle identifier: `com.shotlab.training`
- Version: `1.0`
- Build: `1`
- Deployment target: iOS 15.0
- Initial device scope: iPhone only
- Orientation: portrait only
- Appearance: dark

The identifier is finalized in the repository. It must still be registered in the owner’s Apple Developer account before a signed build can install.

## Configure Apple signing

1. Enroll the publishing organization or individual in the Apple Developer Program.
2. Create or confirm the explicit App ID `com.shotlab.training`.
3. Find the 10-character Team ID in Apple Developer membership details.
4. Run:

```bash
SHOTLAB_DEVELOPMENT_TEAM=ABCDEFGHIJ npm run ios:configure-signing
```

5. Open `ios/App/App.xcodeproj` in Xcode and confirm **Automatically manage signing** is enabled for the App target.
6. Confirm the selected team owns the App ID.

Do not commit certificates, private keys, `.p12` files, provisioning profiles, App Store Connect API keys, or passwords.

## First physical iPhone build

Requirements:

- macOS with the current stable Xcode
- An enrolled Apple Developer account signed into Xcode
- A trusted iPhone connected by cable or paired wirelessly
- Developer Mode enabled on the iPhone

Commands:

```bash
npm ci
npm run build
npm run native:sync:ios
npm run ios:device-build
```

For the first install, use Xcode’s device selector and Run button. Confirm login, navigation, shot logging, safe areas, keyboard behavior, and relaunch persistence.

## Prepare the first TestFlight archive

```bash
npm run build
npm run native:sync:ios
npm run ios:archive
```

Then open Xcode Organizer, validate the archive, and choose **Distribute App → App Store Connect → Upload**.

A TestFlight upload is not complete until App Store Connect finishes processing the build. Do not claim a physical-device build or TestFlight archive has succeeded until it has actually run under the owner’s Apple signing identity.
