-- CreateTable
CREATE TABLE "SlackInstallation" (
    "id" SERIAL NOT NULL,
    "team_id" TEXT,
    "team_name" TEXT,
    "user_token" TEXT,
    "user_scopes" TEXT,
    "user_id" TEXT,
    "token_type" TEXT,
    "enterprise_id" TEXT,
    "enterprise_name" TEXT,
    "enterprise_url" TEXT,
    "is_enterprise_install" BOOLEAN,
    "app_id" TEXT,
    "auth_version" TEXT,
    "bot_id" TEXT,
    "bot_scopes" TEXT,
    "bot_token" TEXT,
    "bot_user_id" TEXT,

    CONSTRAINT "SlackInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlackInstallation_team_id_key" ON "SlackInstallation"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "SlackInstallation_enterprise_id_key" ON "SlackInstallation"("enterprise_id");
