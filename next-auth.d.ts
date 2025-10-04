import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role?: string;
      communityId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
    communityId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    communityId?: string;
  }
}