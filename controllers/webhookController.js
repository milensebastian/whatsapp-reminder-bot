const whatsappService = require("../services/whatsappService");
const reminderService = require("../services/reminderService");
const taskService = require("../services/taskService");
const userService = require("../services/userService");
const pollService = require("../services/pollService");
const aiQueryService = require("../services/aiQueryService");

function extractIncomingMessages(payload) {
  const entries = payload?.entry || [];
  const messages = [];

  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const contacts = value.contacts || [];
      const contactName = contacts[0]?.profile?.name || "";

      for (const message of value.messages || []) {
        messages.push({
          from: message.from,
          id: message.id,
          type: message.type,
          text:
            message.text?.body ||
            message.button?.text ||
            message.interactive?.button_reply?.title ||
            "",
          contactName,
          raw: message,
        });
      }
    }
  }

  return messages;
}

function extractDoneTitle(text) {
  const match = String(text || "").trim().match(/^done(?:\s+(.+))?$/i);
  return match ? (match[1] ? match[1].trim() : "") : null;
}

function extractPollOption(text) {
  const match = String(text || "").trim().match(/^[1-9]\d*$/);
  return match ? Number(match[0]) : null;
}

async function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.status(403).json({
    success: false,
    message: "Webhook verification failed",
  });
}

async function receiveWebhook(req, res, next) {
  try {
    const messages = extractIncomingMessages(req.body);

    if (!messages.length) {
      return res.status(200).json({
        success: true,
        message: "No incoming messages to process",
      });
    }

    for (const incoming of messages) {
      const text = String(incoming.text || "").trim();
      if (!text) continue;

      let user = await userService.upsertUserFromWhatsapp({
        phone: incoming.from,
        whatsappName: incoming.contactName,
      });

      await whatsappService.logMessage({
        userPhone: incoming.from,
        message: text,
        direction: "incoming",
        messageType: "text",
        metadata: {
          whatsappMessageId: incoming.id,
          type: incoming.type,
        },
      });

      if (text.toLowerCase() === "register") {
        const registration = await userService.startRegistration({
          phone: incoming.from,
          whatsappName: incoming.contactName,
        });

        await whatsappService.sendTextMessage(incoming.from, registration.reply, {
          messageType: "system",
        });
        continue;
      }

      if (userService.isRegistrationInProgress(user)) {
        const registration = await userService.continueRegistration(user, text);

        if (registration.handled) {
          await whatsappService.sendTextMessage(incoming.from, registration.reply, {
            messageType: "system",
          });
          continue;
        }
      }

      const doneTitle = extractDoneTitle(text);
      if (doneTitle !== null) {
        try {
          const task = await taskService.markTaskCompleted({
            phone: incoming.from,
            title: doneTitle || undefined,
          });

          await whatsappService.sendTextMessage(incoming.from, `Task marked as completed: ${task.title}`, {
            messageType: "task",
          });
        } catch (error) {
          await whatsappService.sendTextMessage(incoming.from, error.message || "Could not mark the task as completed.", {
            messageType: "system",
          });
        }

        continue;
      }

      const pollOption = extractPollOption(text);
      const hasMenuContext = userService.hasActiveMenuContext(user);

      if (pollOption !== null && hasMenuContext && pollOption >= 1 && pollOption <= 4) {
        const commandResult = await whatsappService.handleBotCommand(incoming.from, text);
        await whatsappService.sendTextMessage(incoming.from, commandResult.response, {
          messageType: "system",
        });
        await userService.clearMenuContext(incoming.from);
        continue;
      }

      if (pollOption !== null) {
        try {
          const results = await pollService.recordVote(incoming.from, pollOption);
          await whatsappService.sendTextMessage(
            incoming.from,
            `Vote recorded for poll: ${results.question}\nYou selected option ${pollOption}.`,
            { messageType: "poll" }
          );
          continue;
        } catch (error) {
          if (!hasMenuContext) {
            await whatsappService.sendTextMessage(incoming.from, error.message || "Could not record your vote.", {
              messageType: "system",
            });
            continue;
          }
        }
      }

      const commandResult = await whatsappService.handleBotCommand(incoming.from, text);
      if (commandResult.recognized) {
        await whatsappService.sendTextMessage(incoming.from, commandResult.response, {
          messageType: "system",
        });

        if (commandResult.command === "menu") {
          await userService.setMenuContext(incoming.from);
        } else if (pollOption !== null && hasMenuContext) {
          await userService.clearMenuContext(incoming.from);
        }
        continue;
      }

      const detected = aiQueryService.detectIntent(text);
      if (detected.intent !== "unknown") {
        let answer = null;

        if (detected.intent === "task_query") {
          answer = await aiQueryService.answerTaskQueries(incoming.from, text);
        } else if (detected.intent === "reminder_query") {
          answer = await aiQueryService.answerReminderQueries(incoming.from, text);
        } else if (detected.intent === "announcement_query") {
          answer = await aiQueryService.answerAnnouncementQueries(incoming.from, text);
        }

        await whatsappService.sendTextMessage(
          incoming.from,
          answer || "Please contact your teacher for more information.",
          { messageType: "system" }
        );
        continue;
      }

      try {
        reminderService.parseReminderMessage(text);
        const reminder = await reminderService.createReminder({
          userPhone: incoming.from,
          sourceMessage: text,
        });

        await whatsappService.sendTextMessage(
          incoming.from,
          `Reminder saved for ${new Date(reminder.reminderTime).toLocaleString()}\n\n${reminder.message}`,
          { messageType: "reminder" }
        );
        continue;
      } catch (error) {
      }

      await whatsappService.sendTextMessage(
        incoming.from,
        "Please contact your teacher for more information.",
        { messageType: "system" }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Webhook messages processed successfully",
      processed: messages.length,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  verifyWebhook,
  receiveWebhook,
};
