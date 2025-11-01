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
            // User exists - this is a sign-in, not signup
            console.log('✅ User already exists, proceeding with sign-in');
            const userData = existingUserDoc.data();
            
            // Check if user has a password set
            if (userData.password) {
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
            } else if (userData.authProvider === 'google' && !userData.password) {
              // User signed up with Google but hasn't set a password
              console.log('❌ User signed up with Google and has no password set');
              throw new Error('This account uses Google sign-in. Please sign in with Google or set a password in settings.');
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
            console.log('🆕 Creating new resident user:', user.email);
            
            // Hash the password before storing
            const hashedPassword = await bcrypt.hash((user as any).password || '', 12);
            
            // Create new resident user with communityId and hashed password
            await setDoc(doc(db, 'users', user.email), {
              name: user.name || user.email.split('@')[0],
              email: user.email,
              role: 'resident',
              communityId: (user as any).communityId,
              password: hashedPassword,
              authProvider: 'credentials',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
            
            console.log('✅ Resident user created:', user.email, 'for community:', (user as any).communityId);
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
            if (userData.deleted === true || userData.status === 'deleted') {
              console.error('❌ LAYER 3 FAILED: Account marked as deleted:', token.email);
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
              // 🚫 NO USER, NO INVITE: DELETED OR NEW
              // ============================================
              // Check if this was a previously authenticated user
              if (token.role || token.communityId) {
                // User had data before - account was DELETED
                console.error('❌ DELETED ACCOUNT: User had data but document removed:', token.email);
                console.error('Previous data:', { role: token.role, communityId: token.communityId });
                
                // Store error info in token before nullifying
                token.error = 'AccountDeleted';
                token.errorMessage = 'Your account has been deleted by an administrator. Please contact support if you believe this is an error.';
                
                return null as any; // Force sign-out - user was deleted
              } else {
                // Brand new user without invite - NOT ALLOWED
                console.error('❌ NEW USER WITHOUT INVITE: No existing account or invite found:', token.email);
                
                // Store error info in token before nullifying
                token.error = 'NoAccount';
                token.errorMessage = 'No account found. Please contact your community administrator to get an invite or access code.';
                
                return null as any; // Force sign-out - no account
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