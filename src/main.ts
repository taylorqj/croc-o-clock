require('dotenv').config()

import { createMessage } from "./slack/templates/textWithImageTemplate";
import bodyParser from 'body-parser';
import { App, ExpressReceiver } from "@slack/bolt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET ?? "",
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'my-super-secret',
  scopes: ['chat:write', 'channels:join', "channels:read"],
  //installationStore: new FileInstallationStore(),
  installationStore: {
    storeInstallation: async (installation) => {
      try {
        const whereCondition = installation.isEnterpriseInstall && installation.enterprise !== undefined 
          ? { enterprise_id: installation.enterprise.id }
          : { team_id: installation.team?.id }

        const existingRecord = await prisma.slackInstallation.findFirst({
          where: whereCondition,
        });

        if (existingRecord) {
          console.log("Existing installation record found, updating.");
          await prisma.slackInstallation.update({
            where: {
              id: existingRecord.id,
            },
            data: {
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
            },
          });

          return;
        }

        console.log("New installation detected. Creating.");
        await prisma.slackInstallation.create({
          data: {
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
          },
        });
      } catch (e) {
        console.error(e);
        throw new Error("Failed saving installation data");
      }
    },
    fetchInstallation: async (installQuery): Promise<any> => {
      try {
        const whereCondition = installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined
          ? { enterprise_id: installQuery.enterpriseId }
          : { team_id: installQuery.teamId };

        const record = await prisma.slackInstallation.findFirst({
          where: whereCondition,
        });

        return record;
      } catch (e) {
        console.error(e);
        throw new Error("Failed fetching installation data");
      }
    },
    deleteInstallation: async (installQuery) => {
      try {
        const whereCondition = installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined
          ? { enterprise_id: installQuery.enterpriseId }
          : { team_id: installQuery.teamId };

        const existingRecord = await prisma.slackInstallation.findFirst({
          where: whereCondition,
        });

        if (existingRecord) {
          await prisma.slackInstallation.delete({
            where: {
              id: existingRecord.id,
            },
          });
        }
      } catch (e) {
        console.error(e);
        throw new Error("Failed deleting installation data");
      }
    },
  },
  installerOptions: {
    directInstall: true,
  },
});


const app = new App({receiver});

receiver.router.use(bodyParser.urlencoded({ extended: false}));

receiver.router.post('/sms', async (req: any, res: any) => {
  const { body } = req;

  console.log("Received text message from Twilio. It's croc-o-clock!");

  try {
    const installations = await prisma.slackInstallation.findMany();

    installations.forEach(async installation => {
      const slackMessage = createMessage({
        text: body.Body,
        image: body.MediaUrl0,
      });

      const channelReq = await app.client.conversations.list({
        token: installation.bot_token ?? undefined,
      });

      const filteredChannels = channelReq?.channels?.filter(channel => channel.is_channel && channel.is_member);

      filteredChannels?.forEach(async channel => {
        if (channel.id) {
          await app.client.chat.postMessage({
            token: installation.bot_token ?? undefined,
            channel: channel.id,
            blocks: slackMessage,
            text: "A croc has dropped but we forgot to load the details..",
          });

          console.log(`Sent message to workspace: ${installation.id} channel: ${channel.id}`)
        }
      });
    });
  } catch (e) {
    console.error("Something happened trying to send messages to slack.")
    console.error(e)
    res.error({ success: false });
  }

  res.json({ success: true });
});

(async () => {
  await app.start(9090);
  console.log('⚡️ Bolt app started');
})();
