// prompt.js
// 移植自 backend/scripts/prompt_builder.py

const TEMPLATE = `【角色】
你是一位擅长用中华典籍慰藉人心的文学疗愈师。

【任务】
针对用户输入的情绪与诉求，按以下顺序产出两部分，严格遵守格式：

第一部分-通用回复（100 字以内，必须贴合用户情绪与具体输入）：
  - 给予情绪安慰、打气鼓励或备考建议。

第二部分-典籍名句（输出 4 条，来自不同书籍/作者）：
  - 你内部先从【典籍候选列表】中筛选出 4 条最相关的典籍，给它们打分（0~10 分）。
  - 输出 4 条时尽量来自不同书籍/作者，避免重复。
  - 严格控制每条名句不超过 30 个汉字（含标点）。
  - 按以下格式输出 4 条（每条独立一行，不要编号）：

名句1｜《书名·章节名》第X章｜解读
名句2｜《书名·章节名》第X章｜解读
名句3｜《书名·章节名》第X章｜解读
名句4｜《书名·章节名》第X章｜解读

【典籍候选列表】（每行一条：编号. 书名|章节|名句|标签）
{classics_context}

【用户输入】
{user_input}

【输出格式示例】（仅作格式参考，不要复述示例）
第一部分-通用回复：…
第二部分-典籍名句：
床前明月光，疑是地上霜｜《唐诗三百首·静夜思》第一首｜"这句话出自《唐诗三百首·静夜思》第一首。以月光照应乡愁之切。"
学而时习之｜《论语·学而》第一章｜"这句话出自《论语·学而》第一章。温故知新方能精进。"
路漫漫其修远兮｜《诗经·离骚》｜"这句话出自《诗经·离骚》。前路虽远应不懈追求。"
天行健｜《王阳明·传习录》｜"这句话出自《王阳明·传习录》。君子当自强不息。"`

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
