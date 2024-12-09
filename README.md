<h1 align="center">
  <br>
  <a href="https://firefuse.io"><img src="https://firefuse.io/_static/icons/firefuse.svg" alt="Firefuse"></a>
</h1>

<h4 align="center">Firebase authentication on steroids.</h4>

<p align="center">
    <a href="https://github.com/1devstudio/firefuse-react/commits/master">
    <img src="https://img.shields.io/github/last-commit/1devstudio/firefuse-react.svg?style=flat-square&logo=github&logoColor=white"
         alt="GitHub last commit">
    </a>
    <a href="https://github.com/1devstudio/firefuse-react/issues">
    <img src="https://img.shields.io/github/issues-raw/1devstudio/firefuse-react.svg?style=flat-square&logo=github&logoColor=white"
         alt="GitHub issues">
    </a>    
    <a href="https://github.com/1devstudio/firefuse-react/pulls">
    <img src="https://img.shields.io/github/issues-pr-raw/1devstudio/firefuse-react.svg?style=flat-square&logo=github&logoColor=white"
         alt="GitHub pull requests">
    </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#credits">Credits</a> •
  <a href="#support">Security</a> •
</p>

---

## Installation

### Add Firefuse to your project

```sh
npm install @firefuse/react
```

### Usage in the application

#### Set the firebase auth configuration

```jsx
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

/**
 * Depends on your project setup, you may want to use firebase config directly
 * or like here via environment variables.
 * Here we assume you are using Vite and have firebase config in .env file.
 */
export const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY,
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.FIREBASE_APP_ID,
  measurementId: import.meta.env.FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = initializeApp(firebaseConfig)

const firebaseAuth = getAuth(firebaseApp);
// here init firestore, analytics etc.

export { firebaseAuth };
```

#### Use the `FirefuseProvider`

```jsx
import React from 'react';
import { FirefuseProvider } from '@firefuse/react';
import { firebaseAuth } from '../config/firebase';

const App = () => {
  return (
    <FirefuseProvider
      domain="my-app.firefuse.io"
      redirectUrl="https://my-app.com"
      firebaseAuth={firebaseAuth}
    >
      <h1>Firefuse</h1>
    </FirefuseProvider>
  );
};
```

#### Debugging

To get more details in the dev console you can also provide additional param `debug`.

```jsx
<FirefuseProvider
    {...otherParams}
    debug={true}
  >
    <h1>Firefuse</h1>
  </FirefuseProvider>
```

## Contributing

We are open to any contributions. Just fork the project, make your changes and open a pull request.

## Credits

This project is developed and maintained by [Firefuse team](https://firefuse.io).

## Security

If you discover any security related issues, please email [info@firefuse.io](mailto:info@firefuse.io) instead of using the issue tracker.









