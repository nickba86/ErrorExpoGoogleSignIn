import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleAuthProvider, signInWithCredential, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Ajuste de la ruta a tu configuración de Firebase

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const { promptAsync, userInfo, loading } = useFirebaseGoogleSignIn();

  return (
    <View style={styles.container}>
      <Text>{userInfo ? `Welcome, ${userInfo.displayName}` : 'Please sign in'}</Text>
      <Button
        title="Google Sign In"
        onPress={() => {
          promptAsync();
        }}
        disabled={loading}
      />
      <StatusBar style="auto" />
    </View>
  );
}

// Hook personalizado para manejar Google Sign-In con Firebase
const useFirebaseGoogleSignIn = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
    scopes: ['profile', 'email'],    
  });

  // Manejo de la respuesta de autenticación
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  // Escuchar los cambios de autenticación
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const storedUser = await AsyncStorage.getItem("@user");
        if (storedUser) {
          setUserInfo(JSON.parse(storedUser));
        }
      } catch (e) {
        console.log("Error loading user:", e);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await AsyncStorage.setItem("@user", JSON.stringify(user));
        setUserInfo(user);
      } else {
        setUserInfo(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    promptAsync,
    userInfo,
    loading,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
