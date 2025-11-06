import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import CryptoJS from "crypto-js";

// --- Configuration ---
const USER_STORAGE_KEY = 'encrypted_user_state';
// IMPORTANT: This key must be securely managed and is a placeholder here.
const ENCRYPTION_SECRET_KEY = "MyUltraSecure256BitKey!123456"; 

export interface UserState {
  id: string | null;
  name: string;
  email: string;
  storage: number; // Storage used in bytes
  projects: string[];
}

// --- Local Storage and AES Encryption Utilities (Mock) ---

/**
 * Mocks an AES encryption process using the defined secret key.
 * In a real application, this must be replaced with a secure cryptographic library (e.g., crypto-js).
 */
const aesEncrypt = (data: UserState): string => {
    try {
        const jsonString = JSON.stringify(data);
        
        // --- REAL AES IMPLEMENTATION GOES HERE ---
        // Example with a typical library API (e.g., CryptoJS):
        const ciphertext = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_SECRET_KEY).toString();
        return ciphertext;
        
        // MOCK: Simple Base64 encoding for self-contained execution
        // return btoa(jsonString);
    } catch (e) {
        console.error("AES Encryption failed:", e);
        return '';
    }
};

/**
 * Mocks an AES decryption process using the defined secret key.
 */
const aesDecrypt = (encryptedData: string): UserState | null => {
    try {
        // --- REAL AES IMPLEMENTATION GOES HERE ---
        // Example with a typical library API (e.g., CryptoJS):
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_SECRET_KEY);
        const jsonString = bytes.toString(CryptoJS.enc.Utf8);

        // MOCK: Simple Base64 decoding
        // const jsonString = atob(encryptedData);

        const parsedData = JSON.parse(jsonString);
        // Validate structure to ensure it's a UserState
        // The check allows id to be string or null
        if (parsedData && (typeof parsedData.id === 'string' || parsedData.id === null)) {
            return parsedData as UserState;
        }
        return null;
    } catch (e) {
        // Data corrupted, key wrong, or not valid AES ciphertext
        console.warn("AES Decryption failed (Corrupted data or invalid key). Clearing local data.", e);
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
    }
};

/**
 * Checks localStorage for existing user state and loads it via AES decryption.
 */
const loadInitialState = (): UserState => {
    const encryptedData = localStorage.getItem(USER_STORAGE_KEY);
    
    if (encryptedData) {
        const decryptedUser = aesDecrypt(encryptedData);
        
        // Only return if a valid user object with an ID exists
        if (decryptedUser && decryptedUser.id) {
            console.log("User state loaded and decrypted from local storage.");
            return decryptedUser;
        }
    }
    
    // Default empty state
    return {
        id: null,
        name: "",
        email: "",
        storage: 0,
        projects: [],
    };
};

const initialState: UserState = loadInitialState();

// --- User Slice Definition ---

export const userSlice = createSlice({
  name: "user",
  initialState,
    // Reducers now handle local storage persistence using AES functions
    reducers: {
        setUser: (state, action: PayloadAction<UserState>) => {
            // Update Redux state
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.email = action.payload.email;
            state.storage = action.payload.storage;
            state.projects = action.payload.projects;
            
            // Side effect: Encrypt (AES mock) and store data in local storage
            const encryptedData = aesEncrypt(action.payload);
            localStorage.setItem(USER_STORAGE_KEY, encryptedData);
        },
        clearUser: (state) => {
            // Update Redux state
            state.id = null;
            state.name = "";
            state.email = "";
            state.storage = 0;
            state.projects = [];

            // Side effect: Clear local storage
            localStorage.removeItem(USER_STORAGE_KEY);
        },
        setStorage: (state, action: PayloadAction<number>) => {
            state.storage = action.payload;

            // Side effect: Update storage value in local storage copy
            const updatedState: UserState = { ...state, storage: action.payload };
            // Encrypt and save the updated state
            const encryptedData = aesEncrypt(updatedState);
            localStorage.setItem(USER_STORAGE_KEY, encryptedData);
        },
    },
});

export const { setUser, clearUser, setStorage } = userSlice.actions;
export default userSlice.reducer;