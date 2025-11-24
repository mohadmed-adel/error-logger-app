-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Error" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "level" TEXT NOT NULL DEFAULT 'error',
    "metadata" TEXT,
    "serverUrl" TEXT,
    "userId" TEXT NOT NULL,
    "userSecretKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Error" ("createdAt", "id", "level", "message", "metadata", "stack", "userId") SELECT "createdAt", "id", "level", "message", "metadata", "stack", "userId" FROM "Error";
DROP TABLE "Error";
ALTER TABLE "new_Error" RENAME TO "Error";
CREATE INDEX "Error_userId_idx" ON "Error"("userId");
CREATE INDEX "Error_createdAt_idx" ON "Error"("createdAt");
CREATE INDEX "Error_serverUrl_idx" ON "Error"("serverUrl");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
