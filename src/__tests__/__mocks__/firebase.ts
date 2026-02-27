// Mock Firebase pour les tests Jest
// Les tests unitaires du ComplianceEngine n'utilisent pas Firebase,
// mais ce mock évite les erreurs d'import si des modules Firebase sont importés.

export const auth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
};

export const db = {};

jest.mock('../../firebase', () => ({
  auth,
  db,
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => auth),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => db),
  doc: jest.fn(),
  setDoc: jest.fn(),
  onSnapshot: jest.fn(),
  getDoc: jest.fn(),
}));
