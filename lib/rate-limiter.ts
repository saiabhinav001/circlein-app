export type RateLimitConfig = {
  maxRequests: number;
  windowSeconds: number;
};

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

type RateLimitDoc = {
  count?: number;
  windowStart?: unknown;
};

function toMillis(value: unknown): number {
  if (!value) {
    return 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
    };

    if (typeof maybeTimestamp.toDate === 'function') {
      return maybeTimestamp.toDate().getTime();
    }

    if (typeof maybeTimestamp.seconds === 'number') {
      return maybeTimestamp.seconds * 1000;
    }
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export async function checkRateLimit(
  db: FirebaseFirestore.Firestore,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const maxRequests = Math.max(1, Math.floor(config.maxRequests || 1));
  const windowSeconds = Math.max(1, Math.floor(config.windowSeconds || 1));
  const windowMs = windowSeconds * 1000;

  const nowMs = Date.now();
  const now = new Date(nowMs);

  const normalizedKey = (key || 'unknown').replace(/\//g, '_').slice(0, 500);
  const docRef = db.collection('rateLimit').doc(normalizedKey);

  try {
    return await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(docRef);

      if (!snapshot.exists) {
        transaction.set(docRef, {
          count: 1,
          windowStart: now,
          updatedAt: now,
          expiresAt: new Date(nowMs + windowMs * 2),
        });

        return {
          allowed: true,
          remaining: Math.max(0, maxRequests - 1),
        };
      }

      const data = (snapshot.data() || {}) as RateLimitDoc;
      const currentCount = Math.max(0, Number(data.count || 0));
      const windowStartMs = toMillis(data.windowStart);
      const hasExpired = !windowStartMs || nowMs - windowStartMs >= windowMs;

      if (hasExpired) {
        transaction.set(
          docRef,
          {
            count: 1,
            windowStart: now,
            updatedAt: now,
            expiresAt: new Date(nowMs + windowMs * 2),
          },
          { merge: true }
        );

        return {
          allowed: true,
          remaining: Math.max(0, maxRequests - 1),
        };
      }

      const nextCount = currentCount + 1;
      const windowEndMs = windowStartMs + windowMs;

      transaction.set(
        docRef,
        {
          count: nextCount,
          updatedAt: now,
          expiresAt: new Date(windowEndMs + windowMs),
        },
        { merge: true }
      );

      if (nextCount > maxRequests) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000)),
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - nextCount),
      };
    });
  } catch {
    // Fail open to avoid blocking valid requests if Firestore transactions are transiently unavailable.
    return {
      allowed: true,
      remaining: maxRequests,
    };
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return 'unknown';
}
