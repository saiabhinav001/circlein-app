import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account", // Always show account picker
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        accessCode: { label: 'Access Code', type: 'text' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        
        try {
          // First, check if user already exists
          const existingUserDoc = await getDoc(doc(db, 'users', credentials?.email || ''));
          
          if (existingUserDoc.exists()) {
            // User exists - check if this is sign-in or adding password via access code
            const userData = existingUserDoc.data();
            
            // ============================================
            // 🔒 CHECK IF USER IS DELETED
            // ============================================
            const isDeleted = userData.deleted === true || userData.status === 'deleted';
            
            if (isDeleted) {
              // Deleted users CANNOT sign in or re-register with same/any access code
              // They must contact admin who can either:
              // 1. Restore their account via restore-user API
              // 2. Generate a completely NEW access code for a NEW email
              throw new Error('This account has been deleted. Please contact your administrator to restore access.');
            }
            
            // Check if user is trying to add password via access code
            if (credentials?.accessCode && (!userData.password || userData.password === '')) {
              // This is signup with access code to add password to existing account
              // Validate access code first - try by ID, then by code field
              let accessCodeDoc = await getDoc(doc(db, 'accessCodes', credentials.accessCode));
              let accessCodeDocId = credentials.accessCode;
              
              // If not found by ID, search by code field
              if (!accessCodeDoc.exists()) {
                const codeQuery = query(
                  collection(db, 'accessCodes'),
                  where('code', '==', credentials.accessCode)
                );
                const codeSnapshot = await getDocs(codeQuery);
                if (!codeSnapshot.empty) {
                  accessCodeDoc = codeSnapshot.docs[0] as any;
                  accessCodeDocId = codeSnapshot.docs[0].id;
                }
              }
              
              if (!accessCodeDoc.exists()) {
                throw new Error('Invalid or expired access code');
              }

              const accessCodeData = accessCodeDoc.data();
              
              if (accessCodeData.isUsed) {
                throw new Error('This access code has already been used');
              }
              
              if (accessCodeData.invalidated) {
                throw new Error('This access code has been invalidated. Please contact your administrator for a new code.');
              }

              // Access code is valid, allow user to set password
              return {
                id: credentials?.email || '',
                email: credentials?.email || '',
                name: credentials?.name || userData.name || '',
                communityId: accessCodeData.communityId || userData.communityId,
                role: userData.role || 'resident',
                password: credentials?.password,
                accessCode: credentials?.accessCode,
                accessCodeDocId: accessCodeDocId, // IMPORTANT: Actual document ID
                isExistingUser: false, // Treat as new signup to trigger password creation
                isAddingPassword: true, // Flag to indicate adding password to existing account
              };
            }
            
            // Regular sign-in - check if user has a password set
            if (userData.password && userData.password !== '') {
              // User has password, validate it
              if (!credentials?.password) {
                throw new Error('Password is required');
              }
              
              // Check if password is bcrypt hashed (starts with $2a$ or $2b$)
              let isPasswordValid = false;
              
              if (userData.password.startsWith('$2a$') || userData.password.startsWith('$2b$')) {
                // Password is hashed, use bcrypt compare
                isPasswordValid = await bcrypt.compare(
                  credentials.password,
                  userData.password
                );
              } else {
                // Password is plain text (legacy), compare directly AND hash it for future
                isPasswordValid = userData.password === credentials.password;
                
                if (isPasswordValid) {
                  // Migrate to bcrypt hash
                  const hashedPassword = await bcrypt.hash(credentials.password, 12);
                  await setDoc(doc(db, 'users', credentials.email || ''), {
                    password: hashedPassword
                  }, { merge: true });
                }
              }
              
              if (!isPasswordValid) {
                throw new Error('Invalid email or password');
              }
              
            } else {
              // User exists but has no password (Google-only account)
              throw new Error('This account uses Google sign-in. Please sign in with Google or use an access code to set up a password.');
            }
            
            return {
              id: credentials?.email || '',
              email: credentials?.email || '',
              name: userData.name || credentials?.name || '',
              communityId: userData.communityId,
              role: userData.role || 'resident',
              isExistingUser: true // Flag to indicate this is existing user
            };
          }

          // User doesn't exist - this is a new signup, require access code
          console.log('New user signup, checking access code');
          
          if (!credentials?.accessCode) {
            throw new Error('Access code required for new users');
          }

          if (!credentials?.password) {
            throw new Error('Password is required for signup');
          }

          // Validate access code and get communityId
          
          // Try to find access code - first by document ID, then by code field
          let accessCodeDoc = await getDoc(doc(db, 'accessCodes', credentials.accessCode));
          let accessCodeDocId = credentials.accessCode;
          
          // If not found by ID, search by 'code' field (for backwards compatibility)
          if (!accessCodeDoc.exists()) {
            const codeQuery = query(
              collection(db, 'accessCodes'),
              where('code', '==', credentials.accessCode)
            );
            const codeSnapshot = await getDocs(codeQuery);
            
            if (!codeSnapshot.empty) {
              accessCodeDoc = codeSnapshot.docs[0] as any;
              accessCodeDocId = codeSnapshot.docs[0].id;
            }
          }
          
          
          if (!accessCodeDoc.exists()) {
            throw new Error('Invalid or expired access code');
          }

          const accessCodeData = accessCodeDoc.data();
          
          // Check if access code is used OR invalidated
          if (accessCodeData.isUsed) {
            throw new Error('This access code has already been used');
          }
          
          if (accessCodeData.invalidated) {
            throw new Error('This access code has been invalidated. Please contact your administrator for a new code.');
          }

          const communityId = accessCodeData.communityId;

          if (!communityId) {
            throw new Error('Access code does not have a valid community assignment');
          }

          // Mark access code as used (use the correct document ID)
          await setDoc(doc(db, 'accessCodes', accessCodeDocId), {
            isUsed: true,
            usedBy: credentials.email,
            usedAt: serverTimestamp()
          }, { merge: true });

          
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.name,
            communityId: communityId,
            password: credentials.password, // Pass password to be saved
            accessCode: credentials.accessCode, // Original code entered by user
            accessCodeDocId: accessCodeDocId, // IMPORTANT: Actual document ID in Firestore
            isExistingUser: false // Flag to indicate this is a new user
          };
        } catch (error) {
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      // In production, redirect to dashboard; in development, show auth-status
      const isDevelopment = process.env.NODE_ENV === 'development';
      return isDevelopment ? `${baseUrl}/auth-status` : `${baseUrl}/dashboard`;
    },
    async signIn({ user, account }) {
      
      // For credentials-based sign-ins (residents with access codes)
      if (account?.provider === 'credentials' && user?.email) {
        try {
          
          // Check if this is a new user or existing user based on flag from authorize
          const isExistingUser = (user as any).isExistingUser;
          
          if (isExistingUser) {
            
            // User exists, just update last login
            await setDoc(doc(db, 'users', user.email), {
              lastLogin: serverTimestamp(),
            }, { merge: true });
          } else {
            console.log('Creating new resident user or adding password:', user.email);
            
            // Check if user exists (might be Google user adding password)
            const existingUserDoc = await getDoc(doc(db, 'users', user.email));
            
            // 🔒 CRITICAL: Block deleted users from being restored via signup
            if (existingUserDoc.exists()) {
              const existingData = existingUserDoc.data();
              if (existingData.deleted === true || existingData.status === 'deleted') {
                return false; // Block sign-in
              }
            }
            
            const isAddingPassword = (user as any).isAddingPassword;
            
            // Hash the password before storing
            const hashedPassword = await bcrypt.hash((user as any).password || '', 12);
            
            if (isAddingPassword && existingUserDoc.exists()) {
              // Existing Google user is adding password
              await setDoc(doc(db, 'users', user.email), {
                password: hashedPassword,
                authProvider: 'hybrid', // Both Google and credentials work now
                communityId: (user as any).communityId, // Update communityId from access code
                updatedAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                passwordSetAt: serverTimestamp(),
              }, { merge: true });
              
              // IMPORTANT: Mark access code as used
              // Use accessCodeDocId which is the actual Firestore document ID
              const codeDocId = (user as any).accessCodeDocId || (user as any).accessCode;
              if (codeDocId) {
                await setDoc(doc(db, 'accessCodes', codeDocId), {
                  isUsed: true,
                  usedBy: user.email,
                  usedAt: serverTimestamp(),
                  passwordAdded: true
                }, { merge: true });
              }
              
            } else {
              // Create new resident user with communityId and hashed password
              // NOTE: Deleted users are blocked earlier, so this only creates truly new accounts
              
              // Get the correct access code document ID
              const codeDocId = (user as any).accessCodeDocId || (user as any).accessCode;
              
              await setDoc(doc(db, 'users', user.email), {
                name: user.name || user.email.split('@')[0],
                email: user.email,
                role: 'resident',
                communityId: (user as any).communityId,
                password: hashedPassword,
                authProvider: 'credentials',
                status: 'active',
                deleted: false,
                profileCompleted: false, // IMPORTANT: Must complete flat number setup
                flatNumber: null,
                accessCodeUsed: codeDocId, // IMPORTANT: Store access code ID for deletion later
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
              });
              
              // IMPORTANT: Mark access code as used
              if (codeDocId) {
                await setDoc(doc(db, 'accessCodes', codeDocId), {
                  isUsed: true,
                  usedBy: user.email,
                  usedAt: serverTimestamp(),
                }, { merge: true });
              }
              
            }
          }
        } catch (error) {
          return false; // Prevent sign in on error
        }
      }
      
      // For Google OAuth sign-ins, check if user is an invited admin
      if (account?.provider === 'google' && user?.email) {
        try {
          // Check if user exists in users collection
          const userDoc = await getDoc(doc(db, 'users', user.email));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // 🔒 CRITICAL: Block deleted users from signing in via Google
            if (userData.deleted === true || userData.status === 'deleted') {
              return false; // Block sign-in
            }
            
            // User exists and is not deleted, update last login
            await setDoc(doc(db, 'users', user.email), {
              lastLogin: serverTimestamp(),
            }, { merge: true });
          } else {
            // User doesn't exist, check if they have an admin invite
            const inviteQuery = await getDocs(
              query(collection(db, 'invites'), where('email', '==', user.email))
            );
            
            if (!inviteQuery.empty) {
              // Found an invite! Create user with admin role
              const inviteData = inviteQuery.docs[0].data();
              
              await setDoc(doc(db, 'users', user.email), {
                name: user.name || user.email.split('@')[0],
                email: user.email,
                role: inviteData.role || 'admin',
                communityId: inviteData.communityId,
                authProvider: 'google',
                password: '', // No password for Google sign-in initially
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                inviteAccepted: true,
                inviteId: inviteQuery.docs[0].id
              });
              
              // Update invite status
              await setDoc(inviteQuery.docs[0].ref, {
                status: 'accepted',
                acceptedAt: serverTimestamp()
              }, { merge: true });
              
            } else {
              // No invite found - create basic user account without communityId
              // They'll need to be assigned to a community by an admin
              
              await setDoc(doc(db, 'users', user.email), {
                name: user.name || user.email.split('@')[0],
                email: user.email,
                role: 'resident', // Default role
                communityId: null, // No community assigned yet
                authProvider: 'google',
                password: '', // No password for Google sign-in initially
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                profileCompleted: false
              });
              
            }
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
        }
      }
      
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // ============================================
      // 🔒 LAYER 1: INITIAL TOKEN SETUP
      // ============================================
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      
      // ============================================
      // 🔒 LAYER 2: FIRESTORE USER VALIDATION
      // ============================================
      // Always fetch fresh user data from Firestore on EVERY request
      // This ensures deleted users can't access the system
      if (token.email) {
        try {
          const userDoc = await getDoc(doc(db, 'users', token.email));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // ============================================
            // 🔒 LAYER 3: ACCOUNT STATUS VALIDATION
            // ============================================
            
            // Check if account is marked as deleted
            // IMPORTANT: Only block if deleted AND not being restored via access code
            if ((userData.deleted === true || userData.status === 'deleted') && 
                userData.status !== 'active') {
              return null as any; // Force sign-out
            }
            
            // Check if account is suspended
            if (userData.status === 'suspended' || userData.suspended === true) {
              return null as any; // Force sign-out
            }
            
            // Check if account is banned
            if (userData.status === 'banned' || userData.banned === true) {
              return null as any; // Force sign-out
            }
            
            // Update last activity timestamp
            await setDoc(doc(db, 'users', token.email), {
              lastActivity: serverTimestamp(),
              lastLogin: serverTimestamp(),
            }, { merge: true });
            
            // Update token with validated user data
            token.role = userData.role;
            token.communityId = userData.communityId;
            token.flatNumber = userData.flatNumber;
            token.profileCompleted = userData.profileCompleted;
            token.status = userData.status || 'active';
            
          } else {
            // ============================================
            // 🔄 AUTO-RECOVERY: CHECK FOR INVITE
            // ============================================
            
            const invitesQuery = query(
              collection(db, 'invites'),
              where('email', '==', token.email),
              where('status', 'in', ['pending', 'accepted'])
            );
            const inviteSnapshot = await getDocs(invitesQuery);
            
            if (!inviteSnapshot.empty) {
              // Found active invite - auto-create user
              const inviteData = inviteSnapshot.docs[0].data();
              
              const newUserData = {
                email: token.email,
                name: token.name || token.email?.split('@')[0] || '',
                role: inviteData.role || 'admin',
                communityId: inviteData.communityId || 'sunny-meadows',
                authProvider: account?.provider || 'google',
                profileCompleted: true,
                status: 'active',
                deleted: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                lastActivity: serverTimestamp(),
              };
              
              await setDoc(doc(db, 'users', token.email), newUserData);
              
              // Update invite status
              await setDoc(inviteSnapshot.docs[0].ref, {
                status: 'accepted',
                acceptedAt: serverTimestamp(),
              }, { merge: true });
              
              // Update token with new user data
              token.role = newUserData.role;
              token.communityId = newUserData.communityId;
              token.profileCompleted = true;
              token.status = 'active';
              
            } else {
              // ============================================
              // 🚫 NO USER, NO INVITE
              // ============================================
              // User document doesn't exist and no invite found
              // This could be:
              // 1. A new user trying to sign in (should use access code via credentials)
              // 2. A deleted account that was fully removed
              
              // For Google OAuth without invite - create basic account and let middleware handle routing
              if (account?.provider === 'google') {
                
                // Create minimal account - they'll need community assignment
                const placeholderData = {
                  email: token.email,
                  name: token.name || token.email?.split('@')[0] || '',
                  role: 'resident',
                  communityId: null,
                  authProvider: 'google',
                  profileCompleted: false,
                  status: 'pending',
                  deleted: false,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  lastLogin: serverTimestamp(),
                };
                
                await setDoc(doc(db, 'users', token.email), placeholderData);
                
                token.role = 'resident';
                token.communityId = undefined;
                token.status = 'pending';
                
              } else {
                // For credentials provider, this shouldn't happen because signIn callback creates user
                // If we're here, something went wrong
                
                // Try one more time to fetch user (maybe race condition)
                const retryUserDoc = await getDoc(doc(db, 'users', token.email));
                if (retryUserDoc.exists()) {
                  const userData = retryUserDoc.data();
                  token.role = userData.role;
                  token.communityId = userData.communityId;
                  token.status = userData.status || 'active';
                } else {
                  token.error = 'NoAccount';
                  token.errorMessage = 'Account creation failed. Please try signing up again.';
                  return null as any;
                }
              }
            }
          }
        } catch (error) {
          
          // Store error info in token
          token.error = 'AuthenticationError';
          token.errorMessage = 'An error occurred during authentication. Please try again.';
          
          // On error, force sign-out for security
          return null as any;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // If token is null or doesn't have email, return empty session
      if (!token || !token.email) {
        return {} as any;
      }

      // Pass error information if present
      if (token.error) {
        (session as any).error = token.error;
        (session as any).errorMessage = token.errorMessage;
      }

      // Pass the token data to the session
      session.user.email = token.email;
      session.user.name = token.name || '';
      session.user.image = token.picture || undefined;
      (session.user as any).role = token.role;
      (session.user as any).communityId = token.communityId;
      (session.user as any).flatNumber = token.flatNumber;
      (session.user as any).profileCompleted = token.profileCompleted;
      (session.user as any).status = token.status;
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Custom error page
  },
  session: {
    strategy: 'jwt',
  },
  events: {
    async signOut({ token }) {
      // Log when user is signed out
    },
  },
};