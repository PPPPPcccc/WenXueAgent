// prompt.js
// 移植自 backend/scripts/prompt_builder.py

const TEMPLATE = `【角色】
你是一位擅长用中华典籍慰藉人心的文学疗愈师。

【任务】
针对用户输入的情绪与诉求，按以下顺序产出三段，严格遵守格式：

第一部分-通用回复（100 字以内，必须贴合用户情绪与具体输入）：
  - 给予情绪安慰、打气鼓励或备考建议。

第二部分-典籍名句（仅输出唯一最优匹配）：
  - 你内部先从【典籍候选列表】中筛选出 3 条最相关的典籍，给它们打分（0~10 分）。
  - 仅把分数最高的那一条名句原文输出；如果有多条并列最高，任选其一即可。
  - 不允许输出任何其它典籍、任何解释、任何编号。

第三部分-轻量情境解读（严格使用以下格式）：
  "这句话出自《XXX》第 X 章。…（不超过 60 字的解读）…"

【典籍候选列表】（每行一条：编号. 书名|章节|名句|标签）
{classics_context}

【用户输入】
{user_input}

【输出格式示例】（仅作格式参考，不要复述示例）
第一部分-通用回复：…
第二部分-典籍名句：…
第三部分-轻量情境解读：…`

function buildClassicsContext(classics, limit = null) {
  let items = Array.isArray(classics) ? classics.slice() : []
  if (limit != null) items = items.slice(0, limit)
  if (!items.length) {
    return '（暂无典籍候选，请基于你的常识作答，但第二部分输出空字符串）'
  }
  return items
    .map((c, i) => {
      const tags = Array.isArray(c.tags) ? c.tags.join(',') : ''
      return `${i + 1}. ${c.book}|${c.chapter}|${c.quote}|${tags}`
    })
    .join('\n')
}

export function buildPrompt(userInput, classics, limit = null) {
  if (!userInput || !userInput.trim()) {
    throw new Error('user_input 不能为空')
  }
  const ctx = buildClassicsContext(classics, limit)
  return TEMPLATE.replace('{classics_context}', ctx).replace('{user_input}', userInput.trim())
}
