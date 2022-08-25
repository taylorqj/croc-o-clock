import { PrismaClient } from "@prisma/client";
import { Installation } from "@slack/bolt";

class SlackInstallationRepository {
  db: PrismaClient;

  constructor(db: PrismaClient) {
    this.db = db;
  }

  mapInstallationToSlackInstallation(installation: Installation) {
    return {
      team_id: installation.team?.id,
      team_name: installation.team?.name,
      user_token: installation.user.token,
      user_scopes: installation.user.scopes?.toString(),
      user_id: installation.user.id,
      token_type: installation.tokenType,
      enterprise_id: installation.enterprise?.id,
      enterprise_name: installation.enterprise?.name,
      is_enterprise_install: installation.isEnterpriseInstall,
      app_id: installation.appId,
      auth_version: installation.authVersion,
      bot_id: installation.bot?.id,
      bot_scopes: installation.bot?.scopes.toString(),
      bot_token: installation.bot?.token,
      bot_user_id: installation.bot?.userId,
    };
  }

  async create(installation: Installation) {
    return await this.db.slackInstallation.create({
      data: this.mapInstallationToSlackInstallation(installation),
    });
  }

  async update(installation: Installation, recordId: number) {
    return await this.db.slackInstallation.update({
      where: {
        id: recordId,
      },
      data: this.mapInstallationToSlackInstallation(installation),
    });
  }

  async findFirstByEnterpriseId(enterpriseId: string) {
    return await this.db.slackInstallation.findFirst({
      where: {
        enterprise_id: enterpriseId,
      },
    });
  }

  async findFirstByTeamId(teamId: string) {
    return await this.db.slackInstallation.findFirst({
      where: {
        team_id: teamId,
      },
    });
  }

  async findByAny(whereCondition: object) {
    return await this.db.slackInstallation.findFirst({
      where: whereCondition,
    });
  }
}

export default SlackInstallationRepository;
