import React, { createContext, useState, useEffect, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  async function signup(email, password) {
    // Create Firebase authentication user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Initial empty profile for the user
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      createdAt: new Date(),
      surveyCompleted: false,
    });

    return userCredential.user;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  async function fetchUserProfile(uid) {
    if (!uid) return null;

    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      setUserProfile(userDoc.data());
      return userDoc.data();
    }
    return null;
  }

  async function updateUserProfile(data) {
    if (!currentUser) return;

    // Update Firestore document
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        ...userProfile,
        ...data,
      },
      { merge: true }
    );

    // Update local state
    setUserProfile((prev) => ({
      ...prev,
      ...data,
    }));
  }

  // Set up auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    fetchUserProfile,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
