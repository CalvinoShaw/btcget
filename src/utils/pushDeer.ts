import type { PushDeerConfig, Article } from '../types';

/**
 * PushDeer 推送结果
 */
export interface PushDeerResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 发送 PushDeer 推送消息
 * @param config PushDeer 配置
 * @param text 消息标题
 * @param desp 消息内容（支持Markdown）
 * @param type 消息类型 (text/markdown/image)
 */
export async function sendPushDeerNotification(
  config: PushDeerConfig,
  text: string,
  desp?: string,
  type: 'text' | 'markdown' | 'image' = 'markdown'
): Promise<PushDeerResult> {
  if (!config.enabled) {
    return {
      success: false,
      error: 'PushDeer未启用',
    };
  }

  if (!config.serverUrl || !config.pushKey) {
    return {
      success: false,
      error: 'PushDeer配置不完整',
    };
  }

  try {
    // 构建请求URL
    const url = new URL('/message/push', config.serverUrl);

    // 构建请求体
    const formData = new URLSearchParams();
    formData.append('pushkey', config.pushKey);
    formData.append('text', text);
    if (desp) {
      formData.append('desp', desp);
    }
    formData.append('type', type);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // PushDeer API 响应格式: { code: number, content: string, error: string }
    if (data.code === 0 || data.code === 200) {
      return {
        success: true,
        message: '推送成功',
      };
    } else {
      return {
        success: false,
        error: data.error || '推送失败',
      };
    }
  } catch (error) {
    console.error('PushDeer推送失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 测试 PushDeer 配置
 * @param config PushDeer 配置
 */
export async function testPushDeerConfig(
  config: PushDeerConfig
): Promise<PushDeerResult> {
  return sendPushDeerNotification(
    config,
    '🔔 BTC Get 测试消息',
    '恭喜！PushDeer 推送配置成功！\n\n现在您可以接收新文章的推送通知了。',
    'markdown'
  );
}

/**
 * 发送新文章通知
 * @param config PushDeer 配置
 * @param articles 新文章列表
 * @param sourceName RSS源名称
 */
export async function notifyNewArticles(
  config: PushDeerConfig,
  articles: Article[],
  sourceName?: string
): Promise<PushDeerResult> {
  if (!config.enabled || !config.notifyOnNewArticles) {
    return { success: false, error: '推送未启用' };
  }

  // 过滤文章
  let filteredArticles = articles;
  if (config.notifyOnlyUnread) {
    filteredArticles = articles.filter((a) => !a.isRead);
  }

  // 检查最少文章数
  const minCount = config.minArticlesForNotify || 1;
  if (filteredArticles.length < minCount) {
    return { success: false, error: '文章数量未达到推送阈值' };
  }

  // 构建消息
  const count = filteredArticles.length;
  const title = sourceName
    ? `📰 ${sourceName} 更新了 ${count} 篇文章`
    : `📰 收到 ${count} 篇新文章`;

  // 构建内容（Markdown格式）
  const content = filteredArticles
    .slice(0, 5) // 最多显示5篇
    .map((article, index) => {
      const date = new Date(article.pubDate).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${index + 1}. **[${article.title}](${article.link})**\n   _${date}_${
        article.creator ? ` · ${article.creator}` : ''
      }`;
    })
    .join('\n\n');

  const footer =
    count > 5 ? `\n\n_...还有 ${count - 5} 篇文章_` : '';

  const desp = `${content}${footer}`;

  return sendPushDeerNotification(config, title, desp, 'markdown');
}

/**
 * 发送批量更新通知
 * @param config PushDeer 配置
 * @param results 更新结果汇总
 */
export async function notifyBatchUpdate(
  config: PushDeerConfig,
  results: {
    totalArticles: number;
    successCount: number;
    failCount: number;
    sources: Array<{ name: string; count: number }>;
  }
): Promise<PushDeerResult> {
  if (!config.enabled || !config.notifyOnNewArticles) {
    return { success: false, error: '推送未启用' };
  }

  const { totalArticles, successCount, failCount, sources } = results;

  if (totalArticles === 0) {
    return { success: false, error: '没有新文章' };
  }

  const title = `🔄 RSS 更新完成：${totalArticles} 篇新文章`;

  const successSources = sources
    .filter((s) => s.count > 0)
    .map((s) => `• ${s.name}: ${s.count} 篇`)
    .join('\n');

  const desp = `**更新统计**\n✅ 成功: ${successCount} 个源\n${
    failCount > 0 ? `❌ 失败: ${failCount} 个源\n` : ''
  }\n**新文章来源**\n${successSources}`;

  return sendPushDeerNotification(config, title, desp, 'markdown');
}
