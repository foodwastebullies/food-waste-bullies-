import dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';
dotenv.config({ path: '.env.local' });

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const slackClient = process.env.SLACK_BOT_TOKEN
  ? new WebClient(process.env.SLACK_BOT_TOKEN)
  : null;

export async function sendResetDM(email: string, name: string, code: string): Promise<boolean> {
  if (!slackClient) {
    console.warn('[SLACK] SLACK_BOT_TOKEN not configured. Cannot send DM.');
    return false;
  }
  try {
    // Look up the Slack user by email
    const lookup = await slackClient.users.lookupByEmail({ email });
    const slackUserId = lookup.user?.id;
    if (!slackUserId) {
      console.warn(`[SLACK] No Slack user found for email: ${email}`);
      return false;
    }
    // Open a DM channel and send the code
    const dm = await slackClient.conversations.open({ users: slackUserId });
    const channelId = dm.channel?.id;
    if (!channelId) return false;

    await slackClient.chat.postMessage({
      channel: channelId,
      text: `Hi ${name}! Your FridgeShare password reset code is: *${code}*\nThis code expires in 1 hour.`,
    });
    return true;
  } catch (err) {
    console.error('[SLACK] Failed to send reset DM:', err);
    return false;
  }
}

interface SlackMessage {
  text: string;
  blocks?: any[];
}

export async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('[SLACK] Webhook URL not configured. Skipping notification.');
    return false;
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`[SLACK] Failed to send message: ${response.statusText}`);
      return false;
    }

    console.log('[SLACK] Message sent successfully');
    return true;
  } catch (error) {
    console.error('[SLACK] Error sending message:', error);
    return false;
  }
}

export function formatNewFoodMessage(foodName: string, ownerName: string, ownerSlack: string, expiryDate: string, servings: number, fridgeName: string) {
  return {
    text: `🍕 New food added: ${foodName}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🍕 New Food Available!",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Food:*\n${foodName}`
          },
          {
            type: "mrkdwn",
            text: `*Owner:*\n${ownerSlack || ownerName}`
          },
          {
            type: "mrkdwn",
            text: `*Expires:*\n${expiryDate}`
          },
          {
            type: "mrkdwn",
            text: `*Location:*\n${fridgeName}`
          },
          {
            type: "mrkdwn",
            text: `*Servings:*\n${servings}`
          }
        ]
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "First come, first served! 🏃"
          }
        ]
      }
    ]
  };
}

export function formatFoodCheckMessage(foodName: string, ownerName: string, ownerSlack: string, expiryDate: string, fridgeName: string) {
  return {
    text: `⏰ ${foodName} has been in the fridge for 36 hours — still there!`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "⏰ Food Still in the Fridge!",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Food:*\n${foodName}`
          },
          {
            type: "mrkdwn",
            text: `*Owner:*\n${ownerSlack || ownerName}`
          },
          {
            type: "mrkdwn",
            text: `*Expires:*\n${expiryDate}`
          },
          {
            type: "mrkdwn",
            text: `*Location:*\n${fridgeName}`
          }
        ]
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "This item has been logged for 36+ hours and hasn't been claimed. Grab it before it expires! 👀"
          }
        ]
      }
    ]
  };
}

export function formatClaimMessage(foodName: string, claimerName: string, servingsRemaining: number) {
  if (servingsRemaining === 0) {
    return {
      text: `✅ ${foodName} has been fully claimed by ${claimerName}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ *${foodName}* has been fully claimed by *${claimerName}*. All gone! 🎉`
          }
        }
      ]
    };
  } else {
    return {
      text: `${claimerName} claimed some ${foodName}. ${servingsRemaining} servings left!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🍽️ *${claimerName}* claimed some *${foodName}*. *${servingsRemaining} servings* still available!`
          }
        }
      ]
    };
  }
}