/**
 * Discord Alert Utilities
 * 
 * Send data quality alerts to Discord #mission-control-board
 */

interface AlertOptions {
  title: string;
  description: string;
  color?: 'green' | 'yellow' | 'red';
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  mentionRoles?: string[];
}

const COLORS = {
  green: 3066993,   // #2ECC71
  yellow: 16776960,  // #FFFF00
  red: 15158332      // #E74C3C
};

/**
 * Send a Discord alert
 */
export async function sendDiscordAlert(options: AlertOptions) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL not configured, skipping alert');
    return;
  }
  
  const mentions = options.mentionRoles?.map(role => `<@&${role}>`).join(' ') || '';
  
  const embed = {
    title: options.title,
    description: options.description,
    color: COLORS[options.color || 'red'],
    fields: options.fields || [],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'QBT Data Monitor'
    }
  };
  
  const payload = {
    content: mentions || undefined,
    embeds: [embed],
    username: 'Data Monitor'
  };
  
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      console.error('Failed to send Discord alert:', res.status, res.statusText);
    }
  } catch (error) {
    console.error('Error sending Discord alert:', error);
  }
}

/**
 * Send data quality issue alert
 */
export async function alertDataQualityIssue(issue: {
  endpoint: string;
  problem: string;
  expectedValue: string;
  actualValue: string;
}) {
  await sendDiscordAlert({
    title: '⚠️ Data Quality Issue Detected',
    description: `Problem detected in **${issue.endpoint}**`,
    color: 'red',
    fields: [
      { name: 'Problem', value: issue.problem, inline: false },
      { name: 'Expected', value: issue.expectedValue, inline: true },
      { name: 'Actual', value: issue.actualValue, inline: true },
    ],
    mentionRoles: ['1466473853407465653'] // @everyone role ID
  });
}

/**
 * Send daily summary alert (green check)
 */
export async function alertDailySummary(summary: {
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: string[];
}) {
  const allPassed = summary.failed === 0;
  
  await sendDiscordAlert({
    title: allPassed ? '🟢 Daily Data Check - All Green' : '🟡 Daily Data Check - Warnings',
    description: `Ran ${summary.totalChecks} validation checks`,
    color: allPassed ? 'green' : 'yellow',
    fields: [
      { name: '✅ Passed', value: summary.passed.toString(), inline: true },
      { name: '❌ Failed', value: summary.failed.toString(), inline: true },
      { name: 'Warnings', value: summary.warnings.join('\n') || 'None', inline: false }
    ]
  });
}

/**
 * Send API health critical alert
 */
export async function alertAPIHealthCritical(failedEndpoints: Array<{
  name: string;
  error: string;
}>) {
  const endpointList = failedEndpoints
    .map(e => `- ❌ **${e.name}**: ${e.error}`)
    .join('\n');
  
  await sendDiscordAlert({
    title: '🔴 Critical: API Health Check Failed',
    description: `${failedEndpoints.length} endpoints are down:\n\n${endpointList}`,
    color: 'red',
    mentionRoles: ['1466473853407465653']
  });
}

/**
 * Send Adveronix stale data alert
 */
export async function alertAdveronixStale(lastUpdateHours: number) {
  await sendDiscordAlert({
    title: '⚠️ Adveronix Sheet Stale',
    description: `Adveronix sheet has not updated in ${lastUpdateHours} hours`,
    color: 'yellow',
    fields: [
      { name: 'Expected', value: 'Updates daily at 4:00 AM CST', inline: false },
      { name: 'Last Update', value: `${lastUpdateHours} hours ago`, inline: false },
      { name: 'Action Required', value: 'Check Adveronix automation', inline: false }
    ],
    mentionRoles: ['1466473853407465653']
  });
}
