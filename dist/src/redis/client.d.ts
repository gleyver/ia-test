/**
 * Cliente Redis para cache distribuído e rate limiting
 * Com connection pooling otimizado para alta concorrência
 */
import Redis from "ioredis";
export declare function getRedisClient(): Redis | null;
export declare function closeRedis(): Promise<void>;
//# sourceMappingURL=client.d.ts.map
