/* eslint-disable prettier/prettier */
import { User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useState, useEffect } from 'react';
import FirebaseAuthClient from '@/models/firebase_auth_client';
import { InAuthUser } from '../models/in_auth_user';

export default function useFirebaseAuth() {
  const [authUser, setAuthUser] = useState<InAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const authStateChanged = async (authState: User | null) => {
    console.log({ authStateChanged: authState });
    if (!authState) {
      setAuthUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setAuthUser({
      uid: authState.uid,
      email: authState.email,
      photoURL: authState.photoURL,
      displayName: authState.displayName,
    });
    setLoading(false);
  };

  const clear = () => {
    setAuthUser(null);
    setLoading(true);
  };

  async function signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      const signInResult = await signInWithPopup(FirebaseAuthClient.getInstance().Auth, provider);

      if (signInResult.user) {
        console.info(signInResult.user)
        const {user} = signInResult;
        const resp = await fetch('/api/members.add',{
          method:'POST',
          headers:{
            'Content-Type' : 'application/json'
          },
          body:JSON.stringify({uid:user.uid,email:user.email,displayName:user.displayName, photoURL : user.photoURL})
        })
        console.info({status:resp.status});
        const respData = await resp.json();
        console.info(respData);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const signOut = () => FirebaseAuthClient.getInstance().Auth.signOut().then(clear);

  useEffect(() => {
    console.log('useEffect');
    // listen for Firebase state change
    const unsubscribe = FirebaseAuthClient.getInstance().Auth.onAuthStateChanged(authStateChanged);
    return () => unsubscribe();
  }, []);

  return {
    authUser,
    loading,
    signInWithGoogle,
    signOut,
  };
}
