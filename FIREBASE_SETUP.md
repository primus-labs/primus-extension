# Firebase Setup Instructions

This extension uses Firebase's Firestore database to store and retrieve mappings between TikTok and Xiaohongshu handles. Follow these steps to set up Firebase for your own development environment.

## Set Up Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project" or select your existing "primus-extension" project
3. Follow the setup wizard to create a new project (if needed)
4. Once your project is created, add a web app to it by clicking on the web icon (</>) 
5. Register your app with a nickname (e.g., "primus-extension-web")
6. Copy the Firebase configuration object (it looks like this):
   ```js
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

## Update the Config File

1. Open the file `src/config/firebase.ts`
2. Replace the placeholder configuration with your actual Firebase configuration:

```typescript
// Replace these values with your actual Firebase config 
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Set Up Firestore Database

1. In the Firebase console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Start in test mode (you can adjust the security rules later)
4. Choose a location for your database that's closest to your main user base
5. Create a collection named "handleMappings" 

## Security Considerations

For the current implementation, we're using Firebase in test mode without authentication. This allows anyone to read and write to the database.

If you want to add authentication or restrict access later:

1. Go to "Firestore Database" > "Rules" in the Firebase console
2. Update the security rules according to your needs, for example:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /handleMappings/{document=**} {
      // Allow anyone to read
      allow read: if true;
      
      // Only allow write if the document has the required fields
      allow write: if 
        request.resource.data.keys().hasAll(['tiktokHandle', 'xiaohongshuHandle']) &&
        request.resource.data.tiktokHandle is string &&
        request.resource.data.xiaohongshuHandle is string;
    }
  }
}
```

## Test Your Setup

After setting up Firebase and updating the configuration:

1. Rebuild the extension
2. Load the extension in your browser
3. Navigate to the IdentityBridge page
4. Connect both TikTok and Xiaohongshu accounts
5. Try saving a handle mapping and verify it appears in your Firestore database
6. Test the search functionality to make sure it can find saved mappings 