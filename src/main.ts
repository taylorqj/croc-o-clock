require("dotenv").config();

import { createMessage } from "./slack/templates/textWithImageTemplate";
import bodyParser from "body-parser";
import { App, ExpressReceiver } from "@slack/bolt";
import { PrismaClient } from "@prisma/client";
import SlackInstallationRepository from "./repositories/slackInstallationRepository";

const prisma = new PrismaClient();

const slackInstallationRepository = new SlackInstallationRepository(prisma);

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET ?? "",
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: "my-super-secret",
  scopes: ["chat:write", "channels:join", "channels:read"],
  installationStore: {
    storeInstallation: async (installation): Promise<void> => {
      try {
        const whereCondition =
          installation.isEnterpriseInstall &&
          installation.enterprise?.id !== undefined
            ? { enterprise_id: installation.enterprise?.id }
            : { team_id: installation.team?.id };

        const existingRecord = await slackInstallationRepository.findByAny(
          whereCondition
        );

        if (existingRecord) {
          await slackInstallationRepository.update(
            installation,
            existingRecord.id
          );

          return;
        }

        await slackInstallationRepository.create(installation);
      } catch (e) {
        console.error(e);

        throw new Error("Failed saving installation data");
      }
    },
    fetchInstallation: async (installQuery): Promise<any> => {
      try {
        const whereCondition =
          installQuery.isEnterpriseInstall &&
          installQuery.enterpriseId !== undefined
            ? { enterprise_id: installQuery.enterpriseId }
            : { team_id: installQuery.teamId };

        const installation = await slackInstallationRepository.findByAny(
          whereCondition
        );

        return installation;
      } catch (e) {
        console.error(e);

        throw new Error("Failed fetching installation data");
      }
    },
    deleteInstallation: async (installQuery) => {
      try {
        const whereCondition =
          installQuery.isEnterpriseInstall &&
          installQuery.enterpriseId !== undefined
            ? { enterprise_id: installQuery.enterpriseId }
            : { team_id: installQuery.teamId };

        const installation = await slackInstallationRepository.findByAny(
          whereCondition
        );

        if (installation) {
          await prisma.slackInstallation.delete({
            where: {
              id: installation.id,
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

const app = new App({ receiver });

receiver.router.use(bodyParser.urlencoded({ extended: false }));

receiver.router.post("/sms", async (req: any, res: any) => {
  const { body } = req;

  console.log("Received text message from Twilio. It's croc-o-clock!");

  try {
    const installations = await prisma.slackInstallation.findMany();

    installations.forEach(async (installation) => {
      const slackMessage = createMessage({
        text: body.Body,
        image: body.MediaUrl0,
      });

      const channelReq = await app.client.conversations.list({
        token: installation.bot_token ?? undefined,
      });

      const filteredChannels = channelReq?.channels?.filter(
        (channel) => channel.is_channel && channel.is_member
      );

      filteredChannels?.forEach(async (channel) => {
        if (channel.id) {
          await app.client.chat.postMessage({
            token: installation.bot_token ?? undefined,
            channel: channel.id,
            blocks: slackMessage,
            text: "A croc has dropped but we forgot to load the details..",
          });

          console.log(
            `Sent message to workspace: ${installation.id} channel: ${channel.id}`
          );
        }
      });
    });
  } catch (e) {
    console.error(e);
    res.error({ error: e });
  }

  res.json({ success: true });
});

(async () => {
  await app.start(9090);

  console.log("⚡️ Croc O'Clock app started");
})();
