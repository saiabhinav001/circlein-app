import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development', // Enable debug mode only in development
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
        console.log('🔐 [v2.0] Authorize called with credentials:', { 
          email: credentials?.email, 
          hasPassword: !!credentials?.password,
          accessCode: credentials?.accessCode,
          name: credentials?.name 
        });
        
        try {
          // First, check if user already exists
          console.log('👤 Checking if user already exists:', credentials?.email);
          const existingUserDoc = await getDoc(doc(db, 'users', credentials?.email || ''));
          
          if (existingUserDoc.exists()) {
            // User exists - check if this is sign-in or adding password via access code
            console.log('✅ User already exists:', credentials?.email);
            const userData = existingUserDoc.data();
            
            // ============================================
            // 🔒 CHECK IF USER IS DELETED
            // ============================================
            const isDeleted = userData.deleted === true || userData.status === 'deleted';
            
            if (isDeleted) {
              console.log('❌ BLOCKED: User account is DELETED:', credentials?.email);
              // Deleted users CANNOT sign in or re-register with same/any access code
              // They must contact admin who can either:
              // 1. Restore their account via restore-user API
              // 2. Generate a completely NEW access code for a NEW email
              throw new Error('This account has been deleted. Please contact your administrator to restore access.');
            }
            
            // Check if user is trying to add password via access code
            if (credentials?.accessCode && (!userData.password || userData.password === '')) {
              console.log('🔑 User has access code and no password - allowing password setup');
              // This is signup with access code to add password to existing account
              // Validate access code first
              const accessCodeDoc = await getDoc(doc(db, 'accessCodes', credentials.accessCode));
              
              if (!accessCodeDoc.exists()) {
                console.log('❌ Access code not found');
                throw new Error('Invalid or expired access code');
              }

              const accessCodeData = accessCodeDoc.data();
              
              if (accessCodeData.isUsed) {
                console.log('❌ Access code already used');
                throw new Error('This access code has already been used');
              }

              // Access code is valid, allow user to set password
              console.log('✅ Access code valid, allowing password setup');
              return {
                id: credentials?.email || '',
                email: credentials?.email || '',
                name: credentials?.name || userData.name || '',
                communityId: accessCodeData.communityId || userData.communityId,
                role: userData.role || 'resident',
                password: credentials?.password,
                accessCode: credentials?.accessCode, // Pass access code to signIn callback
                isExistingUser: false, // Treat as new signup to trigger password creation
                isAddingPassword: true, // Flag to indicate adding password to existing account
              };
            }
            
            // Regular sign-in - check if user has a password set
            if (userData.password && userData.password !== '') {
              // User has password, validate it
              if (!credentials?.password) {
                console.log('❌ Password required but not provided');
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
                  console.log('🔄 Migrating plain text password to bcrypt hash');
                  const hashedPassword = await bcrypt.hash(credentials.password, 12);
                  await setDoc(doc(db, 'users', credentials.email || ''), {
                    password: hashedPassword
                  }, { merge: true });
                }
              }
              
              if (!isPasswordValid) {
                console.log('❌ Invalid password - Password mismatch');
                throw new Error('Invalid email or password');
              }
              
              console.log('✅ Password validated successfully');
            } else {
              // User exists but has no password (Google-only account)
              console.log('❌ User signed up with Google and has no password set');
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
          console.log('🆕 New user signup, checking access code');
          
          if (!credentials?.accessCode) {
            console.log('❌ No access code provided for new user');
            throw new Error('Access code required for new users');
          }

          if (!credentials?.password) {
            console.log('❌ Password required for new signup');
            throw new Error('Password is required for signup');
          }

          // Validate access code and get communityId
          console.log('🔍 Checking access code:', credentials.accessCode);
          const accessCodeDoc = await getDoc(doc(db, 'accessCodes', credentials.accessCode));
          
          console.log('📄 Access code doc exists:', accessCodeDoc.exists());
          
          if (!accessCodeDoc.exists()) {
            console.log('❌ Access code not found in database');
            throw new Error('Invalid or expired access code');
          }

          const accessCodeData = accessCodeDoc.data();
          console.log('📊 Access code data:', accessCodeData);
          
          if (accessCodeData.isUsed) {
            console.log('❌ Access code already used');
            throw new Error('Invalid or expired access code');
          }

          const communityId = accessCodeData.communityId;

          if (!communityId) {
            console.log('❌ No community ID in access code data');
            throw new Error('Access code does not have a valid community assignment');
          }

          // Mark access code as used
          console.log('✅ Marking access code as used');
          await setDoc(doc(db, 'accessCodes', credentials.accessCode), {
            isUsed: true,
            usedBy: credentials.email,
            usedAt: serverTimestamp()
          }, { merge: true });

          console.log('✅ Authorization successful for new user:', credentials.email, 'community:', communityId);
          
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.name,
            communityId: communityId,
            password: credentials.password, // Pass password to be saved
            accessCode: credentials.accessCode, // Pass access code to signIn callback
            isExistingUser: false // Flag to indicate this is a new user
          };
        } catch (error) {
          console.error('💥 Authorization error:', error);
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
      console.log('🚪 Sign in attempt:', { 
        user: { email: user?.email, name: user?.name, communityId: (user as any)?.communityId }, 
        account: { provider: account?.provider } 
      });
      
      // For credentials-based sign-ins (residents with access codes)
      if (account?.provider === 'credentials' && user?.email) {
        try {
          console.log('👤 Processing credentials sign-in for:', user.email);
          
          // Check if this is a new user or existing user based on flag from authorize
          const isExistingUser = (user as any).isExistingUser;
          
          if (isExistingUser) {
            console.log('🔄 Existing user signing in, updating login time:', user.email);
            
            // User exists, just update last login
            await setDoc(doc(db, 'users', user.email), {
              lastLogin: serverTimestamp(),
            }, { merge: true });
          } else {
            console.log('🆕 Creating new resident user or adding password:', user.email);
            
            // Check if user exists (might be Google user adding password)
            const existingUserDoc = await getDoc(doc(db, 'users', user.email));
            const isAddingPassword = (user as any).isAddingPassword;
            
            // Hash the password before storing
            const hashedPassword = await bcrypt.hash((user as any).password || '', 12);
            
            if (isAddingPassword && existingUserDoc.exists()) {
              // Existing Google user is adding password
              console.log('🔑 Adding password to existing Google account:', user.email);
              await setDoc(doc(db, 'users', user.email), {
                password: hashedPassword,
                authProvider: 'hybrid', // Both Google and credentials work now
                communityId: (user as any).communityId, // Update communityId from access code
                updatedAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                passwordSetAt: serverTimestamp(),
              }, { merge: true });
              
              // IMPORTANT: Mark access code as used
              if ((user as any).accessCode) {
                await setDoc(doc(db, 'accessCodes', (user as any).accessCode), {
                  isUsed: true,
                  usedBy: user.email,
                  usedAt: serverTimestamp(),
                  passwordAdded: true
                }, { merge: true });
                console.log('✅ Access code marked as used:', (user as any).accessCode);
              }
              
              console.log('✅ Password added to Google account:', user.email);
            } else {
              // Create/recreate resident user with communityId and hashed password
              // This will overwrite any previously deleted account
              const isRestoration = existingUserDoc.exists() && existingUserDoc.data().deleted;
              
              await setDoc(doc(db, 'users', user.email), {
                name: user.name || user.email.split('@')[0],
                email: user.email,
                role: 'resident',
                communityId: (user as any).communityId,
                password: hashedPassword,
                authProvider: 'credentials',
                status: 'active', // IMPORTANT: Set status to active
                deleted: false, // IMPORTANT: Mark as NOT deleted
                profileCompleted: true,
                createdAt: existingUserDoc.exists() ? existingUserDoc.data().createdAt : serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                // If previously deleted, keep history
                ...(isRestoration ? {
                  restoredAt: serverTimestamp(),
                  restoredViaAccessCode: true,
                  previouslyDeletedAt: existingUserDoc.data().deletedAt,
                  previouslyDeletedBy: existingUserDoc.data().deletedBy,
                } : {}),
              });
              
              // IMPORTANT: Mark access code as used
              if ((user as any).accessCode) {
                await setDoc(doc(db, 'accessCodes', (user as any).accessCode), {
                  isUsed: true,
                  usedBy: user.email,
                  usedAt: serverTimestamp(),
                  ...(isRestoration ? { restoredUser: true } : {})
                }, { merge: true });
                console.log('✅ Access code marked as used:', (user as any).accessCode);
              }
              
              console.log('✅ Resident user created/restored:', user.email, 'for community:', (user as any).communityId);
            }
          }
        } catch (error) {
          console.error('💥 Error in credentials signIn callback:', error);
          return false; // Prevent sign in on error
        }
      }
      
      // For Google OAuth sign-ins, check if user is an invited admin
      if (account?.provider === 'google' && user?.email) {
        try {
          // Check if user exists in users collection
          const userDoc = await getDoc(doc(db, 'users', user.email));
          
          if (!userDoc.exists()) {
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
              
              console.log('✅ Admin user auto-created from invite:', user.email, 'for community:', inviteData.communityId);
            } else {
              // No invite found - create basic user account without communityId
              // They'll need to be assigned to a community by an admin
              console.log('⚠️ No invite found for Google user, creating basic account:', user.email);
              
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
              
              console.log('✅ Basic Google user created (no community):', user.email);
            }
          } else {
            // User exists, update last login
            await setDoc(doc(db, 'users', user.email), {
              lastLogin: serverTimestamp(),
            }, { merge: true });
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
        console.log('🔐 Layer 1: Initial token created for:', token.email);
      }
      
      // ============================================
      // 🔒 LAYER 2: FIRESTORE USER VALIDATION
      // ============================================
      // Always fetch fresh user data from Firestore on EVERY request
      // This ensures deleted users can't access the system
      if (token.email) {
        try {
          console.log('🔐 Layer 2: Validating user in Firestore:', token.email);
          const userDoc = await getDoc(doc(db, 'users', token.email));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // ============================================
            // 🔒 LAYER 3: ACCOUNT STATUS VALIDATION
            // ============================================
            console.log('🔐 Layer 3: Checking account status...');
            
            // Check if account is marked as deleted
            // IMPORTANT: Only block if deleted AND not being restored via access code
            if ((userData.deleted === true || userData.status === 'deleted') && 
                userData.status !== 'active') {
              console.error('❌ LAYER 3 FAILED: Account permanently deleted:', token.email);
              return null as any; // Force sign-out
            }
            
            // Check if account is suspended
            if (userData.status === 'suspended' || userData.suspended === true) {
              console.error('❌ LAYER 3 FAILED: Account suspended:', token.email);
              return null as any; // Force sign-out
            }
            
            // Check if account is banned
            if (userData.status === 'banned' || userData.banned === true) {
              console.error('❌ LAYER 3 FAILED: Account banned:', token.email);
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
            
            console.log('✅ All 3 layers passed for:', token.email, {
              role: token.role,
              communityId: token.communityId,
              status: token.status
            });
          } else {
            // ============================================
            // 🔄 AUTO-RECOVERY: CHECK FOR INVITE
            // ============================================
            console.log('⚠️ User document not found, checking for invite:', token.email);
            
            const invitesQuery = query(
              collection(db, 'invites'),
              where('email', '==', token.email),
              where('status', 'in', ['pending', 'accepted'])
            );
            const inviteSnapshot = await getDocs(invitesQuery);
            
            if (!inviteSnapshot.empty) {
              // Found active invite - auto-create user
              const inviteData = inviteSnapshot.docs[0].data();
              console.log('✅ Found invite, auto-creating user:', inviteData);
              
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
              
              console.log('✅ User auto-created from invite:', {
                email: token.email,
                role: token.role,
                communityId: token.communityId
              });
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
                console.log('⚠️ Google user without invite, creating placeholder account:', token.email);
                
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
                
                console.log('✅ Placeholder account created for Google user');
              } else {
                // For credentials provider, this shouldn't happen because signIn callback creates user
                // If we're here, something went wrong
                console.error('❌ CRITICAL: User document missing after credentials sign-in:', token.email);
                
                // Try one more time to fetch user (maybe race condition)
                const retryUserDoc = await getDoc(doc(db, 'users', token.email));
                if (retryUserDoc.exists()) {
                  console.log('✅ User found on retry!');
                  const userData = retryUserDoc.data();
                  token.role = userData.role;
                  token.communityId = userData.communityId;
                  token.status = userData.status || 'active';
                } else {
                  console.error('❌ User still not found - blocking access');
                  token.error = 'NoAccount';
                  token.errorMessage = 'Account creation failed. Please try signing up again.';
                  return null as any;
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Error in authentication layers:', error);
          
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
        console.error('❌ Invalid token in session callback - forcing sign out');
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
      console.log('👋 User signed out:', token?.email);
    },
  },
};