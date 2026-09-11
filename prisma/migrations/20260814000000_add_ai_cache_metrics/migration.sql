ALTER TABLE "ai_usage_logs" ADD COLUMN "promptCacheHitTokens" INTEGER;
ALTER TABLE "ai_usage_logs" ADD COLUMN "promptCacheMissTokens" INTEGER;
ALTER TABLE "ai_usage_logs" ADD COLUMN "model" TEXT;
