import { toDateInputValue } from "@/lib/date";
import {
  estimateAiUsage,
  hasAiQuota,
  isAiQuotaEnabled,
  recordAiUsage,
} from "@/lib/ai-quota";

export type InboxPlanTask = {
  title: string;
  notes: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  scheduledDate: string | null;
  dueDate: string | null;
};

export type InboxPlan = {
  action: "create_project" | "existing_project" | "single_task" | "ignore";
  projectName: string | null;
  projectObjective: string | null;
  projectMilestone: string | null;
  tasks: InboxPlanTask[];
  reason: string;
};

export type InboxClarificationDimension = {
  key: string;
  question: string;
  options: string[];
};

export type InboxClarification = {
  dimensions: InboxClarificationDimension[];
  supplementPlaceholder: string;
};

export type InboxProjectContext = {
  name: string;
  objective: string | null;
  currentMilestone: string | null;
};

export type TaskEditSuggestion = {
  title?: string;
  notes?: string | null;
  priority?: "low" | "medium" | "high" | "urgent";
  scheduledDate?: string | null;
  dueDate?: string | null;
  focusDate?: string | null;
  reason: string;
};

export type ProjectEditSuggestion = {
  name?: string;
  objective?: string;
  currentMilestone?: string | null;
  status?: string;
  notes?: string | null;
  reason: string;
};

export type TaskCoachAdvice = {
  title: string;
  encouragement: string;
  steps: string[];
  nextStep: string;
};

export type TodaySuggestion = {
  taskId: string;
  title: string;
  projectName: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  reason: string;
};

export type ReviewDraft = {
  summary: string;
  nextActions: string;
};

type FocusTask = {
  id: string;
  title: string;
  projectName: string | null;
  priority: string;
  dueDate: Date | null;
  scheduledDate: Date | null;
};

const priorities = ["low", "medium", "high", "urgent"] as const;
const planActions = [
  "create_project",
  "existing_project",
  "single_task",
  "ignore",
] as const;

function firstLine(content: string) {
  return content.split(/\r?\n/)[0]?.trim() || content.slice(0, 80);
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function safePriority(value: unknown) {
  return priorities.includes(value as (typeof priorities)[number])
    ? (value as (typeof priorities)[number])
    : "medium";
}

function safePlanAction(value: unknown) {
  return planActions.includes(value as (typeof planActions)[number])
    ? (value as (typeof planActions)[number])
    : "single_task";
}

function safePlanTask(value: unknown): InboxPlanTask {
  if (!value || typeof value !== "object") {
    return {
      title: "待整理任务",
      notes: null,
      priority: "medium",
      scheduledDate: null,
      dueDate: null,
    };
  }

  const raw = value as Record<string, unknown>;
  const today = toDateInputValue(new Date());
  return {
    title:
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title.trim().slice(0, 200)
        : "待整理任务",
    notes:
      typeof raw.notes === "string" && raw.notes.trim()
        ? raw.notes.trim().slice(0, 500)
        : null,
    priority: safePriority(raw.priority),
    scheduledDate:
      typeof raw.scheduledDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(raw.scheduledDate) &&
      raw.scheduledDate >= today
        ? raw.scheduledDate
        : null,
    dueDate:
      typeof raw.dueDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate) &&
      raw.dueDate >= today
        ? raw.dueDate
        : null,
  };
}

async function callModel(
  system: string,
  user: string,
  apiKeyOverride?: string,
  modelOverride?: string,
  baseUrlOverride?: string,
) {
  const apiKey =
    apiKeyOverride ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model =
    modelOverride ||
    process.env.DEEPSEEK_MODEL ||
    process.env.OPENAI_MODEL ||
    "deepseek-chat";
  const baseUrl = (
    baseUrlOverride ||
    process.env.DEEPSEEK_BASE_URL ||
    "https://api.deepseek.com"
  ).replace(/\/$/, "");

  try {
    if (isAiQuotaEnabled() && !(await hasAiQuota())) return null;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };
    const content = data.choices?.[0]?.message?.content ?? null;

    if (isAiQuotaEnabled()) {
      const usage = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens ?? 0,
            completionTokens: data.usage.completion_tokens ?? 0,
            totalTokens: data.usage.total_tokens ?? 0,
          }
        : await estimateAiUsage({ system, user }, content);
      await recordAiUsage(usage);
    }

    return content;
  } catch {
    return null;
  }
}

function heuristicPlan(content: string, projectNames: string[]): InboxPlan {
  const lower = content.toLowerCase();
  const projectName =
    projectNames.find((name) => lower.includes(name.toLowerCase())) ?? null;

  if (/(忽略|不用处理|删除|暂时不要)/.test(lower)) {
    return {
      action: "ignore",
      projectName,
      projectObjective: null,
      projectMilestone: null,
      tasks: [],
      reason: "本地规则：内容包含忽略类关键词",
    };
  }

  return {
    action: projectName ? "existing_project" : "single_task",
    projectName,
    projectObjective: null,
    projectMilestone: null,
    tasks: [
      {
        title: firstLine(content),
        notes: null,
        priority:
          /(紧急|尽快|今天|立刻)/.test(lower)
            ? "high"
            : "medium",
        scheduledDate: null,
        dueDate: null,
      },
    ],
    reason: projectName
      ? "本地规则：归入已有项目"
      : "本地规则：暂按单条任务处理",
  };
}

function heuristicClarification(
  content: string,
  projectNames: string[],
): InboxClarification {
  const projectName =
    projectNames.find((name) => content.includes(name)) ?? null;

  if (projectName) {
    return {
      dimensions: [
        {
          key: "outcome",
          question: `你希望“${projectName}”这次先得到什么结果？`,
          options: [
            "先推进到可展示的一步",
            "先形成稳定节奏",
            "先验证这个方向是否值得做",
          ],
        },
        {
          key: "priority",
          question: "这件事现在处在什么优先级？",
          options: [
            "本周最重要",
            "重要但可以慢慢推进",
            "先暂缓，只记录想法",
          ],
        },
        {
          key: "firstAction",
          question: "你更倾向第一步从哪开始？",
          options: [
            "先做最小的一版",
            "先研究别人怎么做",
            "先整理现有材料",
          ],
        },
      ],
      supplementPlaceholder: `如果你觉得这些都不准确，可以补充两句，例如“我想用 ${projectName} 完成一个具体结果”。`,
    };
  }

  return {
    dimensions: [
      {
        key: "outcome",
        question: "你更希望这次先得到什么结果？",
        options: [
          "先做成一个能展示的成果",
          "先形成稳定习惯",
          "先验证是否值得做",
        ],
      },
      {
        key: "priority",
        question: "这件事在你的优先级里是什么位置？",
        options: [
          "本周最重要",
          "重要但可以慢慢做",
          "先暂缓，只记录想法",
        ],
      },
      {
        key: "firstAction",
        question: "你更倾向第一步从哪开始？",
        options: [
          "先做最小的一版",
          "先研究别人的做法",
          "先整理现有材料",
        ],
      },
    ],
    supplementPlaceholder:
      "如果你觉得这些都不准确，可以补充两句，比如你希望得到什么结果。",
  };
}

export async function clarifyInbox(
  content: string,
  projectNames: string[],
  apiKey?: string,
  model?: string,
  baseUrl?: string,
  projectContext?: InboxProjectContext[],
  memorySummary?: string,
  evidence?: string[],
) {
  const fallback = heuristicClarification(content, projectNames);
  const text = await callModel(
    `你是下一步的规划助手。用户会输入一个模糊想法，你需要先把想法拆成 2-4 个关键维度，每个维度给出 3 个用户能直接点击的选项，而不是直接生成计划。只返回 JSON，不要 Markdown。格式：{"dimensions":[{"key":"维度标识","question":"简短问题","options":["3个简单选项"]}],"supplementPlaceholder":"补充框提示语"}。`,
    JSON.stringify({
      content,
      projectNames,
      projects: projectContext ?? [],
      memorySummary: memorySummary ?? null,
      contextEvidence: evidence ?? [],
    }),
    apiKey,
    model,
    baseUrl,
  );

  if (!text) return fallback;

  try {
    const raw = JSON.parse(
      extractJson(text) ?? "{}",
    ) as Record<string, unknown>;
    const rawDimensions = Array.isArray(raw.dimensions)
      ? raw.dimensions
      : raw.question && Array.isArray(raw.options)
        ? [
            {
              key: "direction",
              question: raw.question,
              options: raw.options,
            },
          ]
        : [];
    const dimensions = rawDimensions
      .filter(
        (dimension): dimension is InboxClarificationDimension =>
          Boolean(dimension) &&
          typeof dimension === "object" &&
          typeof dimension.question === "string" &&
          Array.isArray(dimension.options),
      )
      .map((dimension) => ({
        key:
          typeof dimension.key === "string" && dimension.key.trim()
            ? dimension.key.trim()
            : `dimension-${Math.random().toString(36).slice(2, 7)}`,
        question: dimension.question.trim().slice(0, 200),
        options: dimension.options
          .filter(
            (option): option is string =>
              typeof option === "string" && option.trim().length > 0,
          )
          .slice(0, 3)
          .map((option) => option.trim().slice(0, 100)),
      }))
      .filter((dimension) => dimension.question && dimension.options.length)
      .slice(0, 4);

    return {
      dimensions: dimensions.length ? dimensions : fallback.dimensions,
      supplementPlaceholder:
        typeof raw.supplementPlaceholder === "string" &&
        raw.supplementPlaceholder.trim()
          ? raw.supplementPlaceholder.trim()
          : fallback.supplementPlaceholder,
    };
  } catch {
    return fallback;
  }
}

export async function planInbox(
  content: string,
  projectNames: string[],
  apiKey?: string,
  model?: string,
  baseUrl?: string,
  direction?: string,
  supplement?: string,
  projectContext?: InboxProjectContext[],
  memorySummary?: string,
  dimensionChoices?: string[],
  evidence?: string[],
  maxTasks?: number,
) {
  const clarifiedContent = [content, direction, supplement]
    .filter((part): part is string => Boolean(part?.trim()))
    .join("\n");
  const fallback = heuristicPlan(clarifiedContent, projectNames);

  const text = await callModel(
    `你是下一步的计划助手。今天是 ${toDateInputValue(new Date())}。用户会输入一个随意想法，你需要把它整理成一个可执行计划。只返回 JSON，不要 Markdown。字段：action 必须是 create_project、existing_project、single_task、ignore 之一；projectName 只能从给定项目中选择，若新建项目则给一个简洁名称；projectObjective 是项目目标；projectMilestone 是当前里程碑；tasks 是 1-5 条任务，每项包含 title、notes、priority、scheduledDate、dueDate；reason 用中文说明计划理由。日期格式是 YYYY-MM-DD 或 null。所有日期必须基于今天，不能使用训练数据中的旧日期。如果 maxTasks 存在，tasks 数量必须小于或等于 maxTasks；当输入里出现多个目标时，也要遵守 maxTasks。如果 contextEvidence 有内容，reason 必须引用其中至少一条真实依据。如果 memorySummary 中有用户偏好或规划提示，必须遵守。首条任务应该是今天或明天能启动的最小动作。`,
    JSON.stringify({
      content: clarifiedContent,
      projectNames,
      projects: projectContext ?? [],
      memorySummary: memorySummary ?? null,
      dimensionChoices: dimensionChoices ?? [],
      contextEvidence: evidence ?? [],
      maxTasks: maxTasks ?? null,
    }),
    apiKey,
    model,
    baseUrl,
  );

  if (!text) return fallback;

  try {
    const raw = JSON.parse(extractJson(text) ?? "{}") as Partial<InboxPlan>;
    const tasks = Array.isArray(raw.tasks)
      ? raw.tasks.map(safePlanTask).slice(0, maxTasks ?? 5)
      : fallback.tasks;
    const action = safePlanAction(raw.action);

    return {
      action,
      projectName:
        typeof raw.projectName === "string" && raw.projectName.trim()
          ? raw.projectName.trim().slice(0, 120)
          : fallback.projectName,
      projectObjective:
        typeof raw.projectObjective === "string" && raw.projectObjective.trim()
          ? raw.projectObjective.trim().slice(0, 500)
          : fallback.projectObjective,
      projectMilestone:
        typeof raw.projectMilestone === "string" && raw.projectMilestone.trim()
          ? raw.projectMilestone.trim().slice(0, 200)
          : fallback.projectMilestone,
      tasks: tasks.length ? tasks : fallback.tasks,
      reason:
        typeof raw.reason === "string" && raw.reason.trim()
          ? raw.reason.trim()
          : fallback.reason,
    };
  } catch {
    return fallback;
  }
}

export async function generateTaskEditSuggestion(input: {
  title: string;
  notes?: string | null;
  priority?: string;
  scheduledDate?: string | null;
  dueDate?: string | null;
  focusDate?: string | null;
  idea: string;
}, memorySummary?: string, evidence?: string[]): Promise<TaskEditSuggestion> {
  const fallback: TaskEditSuggestion = {
    title: input.idea.trim() || input.title,
    notes: input.notes ?? null,
    priority: safePriority(input.priority),
    reason: "本地规则：把你的想法作为新的任务标题，保留原备注。",
  };

  const text = await callModel(
    `你是下一步的任务修改助手。用户会输入一个修改想法，以及当前任务字段。你需要理解想法，并返回最合理的修改建议。只返回 JSON，不要 Markdown。格式：{"title":"新标题","notes":"备注","priority":"low|medium|high|urgent","scheduledDate":"YYYY-MM-DD或null","dueDate":"YYYY-MM-DD或null","focusDate":"YYYY-MM-DD或null","reason":"中文说明为什么这样改"}。只返回需要改的字段，reason 必须返回。`,
    JSON.stringify({
      ...input,
      memorySummary: memorySummary ?? null,
      contextEvidence: evidence ?? [],
    }),
  );

  if (!text) return fallback;

  try {
    const raw = JSON.parse(extractJson(text) ?? "{}") as Partial<TaskEditSuggestion>;
    return {
      title:
        typeof raw.title === "string" && raw.title.trim()
          ? raw.title.trim().slice(0, 200)
          : fallback.title,
      notes:
        typeof raw.notes === "string"
          ? raw.notes.trim()
          : fallback.notes,
      priority: safePriority(raw.priority),
      scheduledDate:
        typeof raw.scheduledDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(raw.scheduledDate)
          ? raw.scheduledDate
          : fallback.scheduledDate,
      dueDate:
        typeof raw.dueDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate)
          ? raw.dueDate
          : fallback.dueDate,
      focusDate:
        typeof raw.focusDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(raw.focusDate)
          ? raw.focusDate
          : fallback.focusDate,
      reason:
        typeof raw.reason === "string" && raw.reason.trim()
          ? raw.reason.trim()
          : fallback.reason,
    };
  } catch {
    return fallback;
  }
}

export async function generateProjectEditSuggestion(input: {
  name: string;
  objective: string;
  currentMilestone?: string | null;
  status?: string;
  notes?: string | null;
  idea: string;
}, memorySummary?: string, evidence?: string[]): Promise<ProjectEditSuggestion> {
  const fallback: ProjectEditSuggestion = {
    objective: input.idea.trim() || input.objective,
    notes: input.notes ?? null,
    reason: "本地规则：把你的想法作为新的项目目标，保留原备注。",
  };

  const text = await callModel(
    `你是下一步的项目修改助手。用户会输入一个修改想法，以及当前项目字段。你需要理解想法，并返回最合理的修改建议。只返回 JSON，不要 Markdown。格式：{"name":"项目名称","objective":"项目目标","currentMilestone":"当前里程碑","status":"active|paused|completed|archived","notes":"备注","reason":"中文说明为什么这样改"}。只返回需要改的字段，reason 必须返回。`,
    JSON.stringify({
      ...input,
      memorySummary: memorySummary ?? null,
      contextEvidence: evidence ?? [],
    }),
  );

  if (!text) return fallback;

  try {
    const raw = JSON.parse(extractJson(text) ?? "{}") as Partial<ProjectEditSuggestion>;
    return {
      name:
        typeof raw.name === "string" && raw.name.trim()
          ? raw.name.trim().slice(0, 120)
          : undefined,
      objective:
        typeof raw.objective === "string" && raw.objective.trim()
          ? raw.objective.trim().slice(0, 500)
          : fallback.objective,
      currentMilestone:
        typeof raw.currentMilestone === "string"
          ? raw.currentMilestone.trim()
          : fallback.currentMilestone,
      status:
        typeof raw.status === "string" &&
        ["active", "paused", "completed", "archived"].includes(raw.status)
          ? raw.status
          : undefined,
      notes:
        typeof raw.notes === "string"
          ? raw.notes.trim()
          : fallback.notes,
      reason:
        typeof raw.reason === "string" && raw.reason.trim()
          ? raw.reason.trim()
          : fallback.reason,
    };
  } catch {
    return fallback;
  }
}

export async function generateTaskCoachAdvice(input: {
  title: string;
  notes?: string | null;
  projectName?: string | null;
  status?: string;
  message: string;
}, memorySummary?: string, evidence?: string[]): Promise<TaskCoachAdvice> {
  const fallback = buildLocalTaskCoachAdvice(input);

  const text = await callModel(
    `你是下一步里的任务伙伴，不是标准助手。用户会给你一个任务标题和一段很随意的想法。你要像熟悉他的朋友一样，先接住他的话，再写一张便利贴。
硬性要求：
- 必须回应用户原话和任务标题，不能只讲通用道理。
- 禁止使用“卡住很正常”“保持耐心”“一步一步来”“你可以尝试”这类模板句。
- 禁止每次使用同一套结构；根据用户原话里的具体词改变标题、鼓励语、步骤和下一步。
- 把用户原话中的细节直接带进内容，不要只替换任务名。
- 步骤要具体到马上能做，不能抽象。
- 语气像人写的，不像 AI 生成的。
- 只返回 JSON，不要 Markdown。
格式：{"title":"便利贴标题","encouragement":"一句鼓励","steps":["2-3个具体指导步骤"],"nextStep":"最小可执行的下一步"}
示例输入：任务“整理作品集”，想法“我不知道该放什么”
示例输出：{"title":"先放三张最能代表你的","encouragement":"你不知道放什么，是因为还没想清楚要给谁看。","steps":["先写下你希望作品集让谁看到","挑三张你最想被记住的作品","把这三张先放上去，其他以后再说"],"nextStep":"挑三张作品，先放上去"}`,
    JSON.stringify({
      ...input,
      memorySummary: memorySummary ?? null,
      contextEvidence: evidence ?? [],
    }),
  );

  if (!text) return fallback;

  try {
    const raw = JSON.parse(extractJson(text) ?? "{}") as Partial<TaskCoachAdvice>;
    const steps = Array.isArray(raw.steps)
      ? raw.steps
          .filter(
            (step): step is string =>
              typeof step === "string" && step.trim().length > 0,
          )
          .slice(0, 4)
      : [];

    return {
      title:
        typeof raw.title === "string" && raw.title.trim()
          ? raw.title.trim().slice(0, 80)
          : fallback.title,
      encouragement:
        typeof raw.encouragement === "string" && raw.encouragement.trim()
          ? raw.encouragement.trim().slice(0, 200)
          : fallback.encouragement,
      steps: steps.length ? steps : fallback.steps,
      nextStep:
        typeof raw.nextStep === "string" && raw.nextStep.trim()
          ? raw.nextStep.trim().slice(0, 200)
          : fallback.nextStep,
    };
  } catch {
    return fallback;
  }
}

function buildLocalTaskCoachAdvice(input: {
  title: string;
  notes?: string | null;
  projectName?: string | null;
  status?: string;
  message: string;
}): TaskCoachAdvice {
  const message = input.message.trim();
  const title = input.title;
  const short =
    message.length > 36 ? `${message.slice(0, 36)}…` : message;
  const lower = message.toLowerCase();
  const seed = [...`${title}:${message}`].reduce(
    (hash, char) => (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0,
    0,
  );

  if (/没头绪|不知道|怎么开始|不会开始|完全不懂|没想法/.test(lower)) {
    return [
      {
        title: `${title} 的启动版`,
        encouragement: `你说“${short}”，那就先从这句话里找一个能做的动词。`,
        steps: [
          `把“${title}”的第一步写成“打开、写下、列出或试做”这类动作。`,
          `从“${short}”里挑一个你最关心的词，作为这次目标。`,
          `只做 10 分钟，做完就停。`,
        ],
        nextStep: `用一句话写出“${title}”的 10 分钟第一步。`,
      },
      {
        title: `${title} 的最小开始`,
        encouragement: `“${short}”还没有变成动作，所以你觉得不知道怎么开始。`,
        steps: [
          `把“${title}”变成一个今天能完成的最小结果。`,
          `把“${short}”转成一句能问自己的话。`,
          `先回答那句话，再决定下一步。`,
        ],
        nextStep: `回答“${short}”里最让你没底的那句话。`,
      },
      {
        title: `${title} 的第一次推进`,
        encouragement: `“${title}”对你不是没价值，是第一步还没被定义清楚。`,
        steps: [
          `先给“${title}”设一个 10 分钟标准。`,
          `从“${short}”里找出最容易先做到的部分。`,
          `今天只完成那一个部分。`,
        ],
        nextStep: `完成“${title}”里最容易先做到的部分。`,
      },
    ][seed % 3];
  }

  if (/卡住|困难|问题|不会|不懂|卡在|做不下去/.test(lower)) {
    return [
      {
        title: `${title} 的卡点`,
        encouragement: `你说“${short}”，那我们就只处理这一句里最卡的部分。`,
        steps: [
          `把“${title}”里最卡的部分单独摘出来。`,
          `写下你试过什么、卡在什么现象上。`,
          `先只解决这个卡点。`,
        ],
        nextStep: `写下“${title}”里最卡的一句话。`,
      },
      {
        title: `${title} 的诊断`,
        encouragement: `卡住通常不是不会，而是没有把问题说清楚。`,
        steps: [
          `把“${short}”改写成一句“我卡在……，因为……”。`,
          `看看这句话里，哪个词是真正难点。`,
          `只针对那个难点找一个小动作。`,
        ],
        nextStep: `把“${short}”改写成“我卡在…，因为…”。`,
      },
      {
        title: `${title} 的下一步`,
        encouragement: `你已经走到具体问题这一步，剩下的不是重新开始，而是拆小。`,
        steps: [
          `找出“${title}”里你现在能控制的最小部分。`,
          `先做能控制的，暂时放下不能控制的。`,
          `把下一步写成一句明确的动作。`,
        ],
        nextStep: `写出“${title}”里现在能控制的最小动作。`,
      },
    ][seed % 3];
  }

  if (/没时间|时间不够|来不及|太忙/.test(lower)) {
    return [
      {
        title: `${title} 的碎片版`,
        encouragement: `你说“${short}”，那就把它切成 10 分钟能吃下去的样子。`,
        steps: [
          `把“${title}”拆成 10 分钟和 30 分钟两个版本。`,
          `今天只做 10 分钟版本。`,
          `做完后把剩余部分标记为明天继续。`,
        ],
        nextStep: `完成“${title}”的 10 分钟版。`,
      },
      {
        title: `${title} 的低负担版`,
        encouragement: `没时间通常不是真的没有，而是这个任务在你心里被放大了。`,
        steps: [
          `把“${title}”缩小成“只做一步”的标准。`,
          `先做最不需要准备材料的那一步。`,
          `做完后允许自己停。`,
        ],
        nextStep: `完成“${title}”里最不需要准备的一步。`,
      },
      {
        title: `${title} 的 10 分钟入口`,
        encouragement: `不用等有空，先给“${title}”留 10 分钟。`,
        steps: [
          `把“${title}”里最容易启动的动作挑出来。`,
          `设一个 10 分钟倒计时。`,
          `时间到就停，不要求做完。`,
        ],
        nextStep: `今天做 10 分钟“${title}”。`,
      },
    ][seed % 3];
  }

  if (/太多|乱|优先级|选择|不知道先做|哪个/.test(lower)) {
    return [
      {
        title: `${title} 的取舍`,
        encouragement: `“${short}”听起来不是一件事，而是好几件事叠在一起。`,
        steps: [
          `把“${title}”拆成“现在必须做、可以缓、可以不做”三堆。`,
          `从“必须做”里挑一件。`,
          `其他暂时不看。`,
        ],
        nextStep: `从“${title}”里挑一件现在必须做的。`,
      },
      {
        title: `${title} 的排序`,
        encouragement: `选择太多的时候，第一步不是做，而是删。`,
        steps: [
          `把“${title}”相关的所有念头列出来。`,
          `删掉现在不重要的。`,
          `剩下的只选一件推进。`,
        ],
        nextStep: `把“${title}”相关的念头删到只剩一件。`,
      },
      {
        title: `${title} 的唯一重点`,
        encouragement: `“${short}”让你乱，是因为没有唯一重点。`,
        steps: [
          `写下“${title}”如果只做一件事，会是什么。`,
          `把其他事标记为稍后。`,
          `先做那一件事。`,
        ],
        nextStep: `写下“${title}”唯一要做的一件事。`,
      },
    ][seed % 3];
  }

  return [
    {
      title: `${title} 的具体化`,
      encouragement: `你说“${short}”，下一步不是马上做，而是把它说具体。`,
      steps: [
        `把“${title}”写成具体结果。`,
        `从“${short}”里挑一个能验证的词。`,
        `先完成能验证的最小一步。`,
      ],
      nextStep: `写出“${title}”的具体结果。`,
    },
    {
      title: `${title} 的下一步`,
      encouragement: `关于“${title}”，你已经有关键想法了，现在只需要把它变成动作。`,
      steps: [
        `把“${title}”拆成一个今天能做的动作。`,
        `把“${short}”里最想解决的部分放进去。`,
        `从不需要别人帮忙的那一项开始。`,
      ],
      nextStep: `写出“${title}”今天能做的第一个动作。`,
    },
    {
      title: `${title} 的推进点`,
      encouragement: `“${short}”就是这次推进的入口，不用再重新想方向。`,
      steps: [
        `围绕“${short}”选一个小动作。`,
        `先做 10 分钟。`,
        `把结果或卡点写下来。`,
      ],
      nextStep: `围绕“${short}”做 10 分钟。`,
    },
  ][seed % 3];
}

function heuristicToday(tasks: FocusTask[]): TodaySuggestion[] {
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...tasks]
    .sort((a, b) => {
      const priorityDiff =
        (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0);
    })
    .slice(0, 3)
    .map((task) => ({
      taskId: task.id,
      title: task.title,
      projectName: task.projectName,
      priority: safePriority(task.priority),
      reason: task.dueDate
        ? "本地规则：优先级较高且有截止时间"
        : "本地规则：按优先级推荐",
    }));
}

export async function suggestTodayFocus(
  tasks: FocusTask[],
  context?: {
    reviewSummary?: string;
    projects?: InboxProjectContext[];
  },
  memorySummary?: string,
  evidence?: string[],
) {
  const fallback = heuristicToday(tasks);
  if (!tasks.length) return fallback;

  const text = await callModel(
    "你是下一步规划助手。根据任务列表选择最重要的 1-3 个任务作为今日重点。只返回 JSON，不要 Markdown。格式：{\"suggestions\":[{\"title\":\"任务标题\",\"reason\":\"中文理由\"}]}。",
    JSON.stringify({
      tasks: tasks.map((task) => ({
        title: task.title,
        project: task.projectName,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString().slice(0, 10),
      })),
      reviewSummary: context?.reviewSummary ?? null,
      projects: context?.projects ?? [],
      memorySummary: memorySummary ?? null,
      contextEvidence: evidence ?? [],
    }),
  );

  if (!text) return fallback;

  try {
    const raw = JSON.parse(extractJson(text) ?? "{}") as {
      suggestions?: Array<{ title?: string; reason?: string }>;
    };
    const suggestions = (raw.suggestions ?? [])
      .map((item) => {
        const task = tasks.find((candidate) => candidate.title === item.title);
        if (!task) return null;
        return {
          taskId: task.id,
          title: task.title,
          projectName: task.projectName,
          priority: safePriority(task.priority),
          reason: typeof item.reason === "string" ? item.reason : "AI 建议",
        };
      })
      .filter((item): item is TodaySuggestion => item !== null)
      .slice(0, 3);

    return suggestions.length ? suggestions : fallback;
  } catch {
    return fallback;
  }
}

function heuristicReview(
  completed: Array<{ title: string; projectName: string | null }>,
  open: Array<{ title: string; projectName: string | null }>,
  planned: Array<{ title: string }>,
  projects: Array<{
    name: string;
    currentMilestone: string | null;
    taskCount: number;
  }>,
) {
  const projectSummary = projects.length
    ? `项目状态：${projects
        .slice(0, 3)
        .map(
          (project) =>
            `${project.name}${
              project.currentMilestone
                ? ` / ${project.currentMilestone}`
                : ""
            }（${project.taskCount} 个任务）`,
        )
        .join("；")}。`
    : "当前没有进行中的项目。";
  const completedText = completed.length
    ? completed
        .slice(0, 3)
        .map((task) => task.title)
        .join("、")
    : "暂无完成";
  const openText = open.length
    ? `当前仍未完成：${open
        .slice(0, 3)
        .map((task) => task.title)
        .join("、")}。`
    : "";

  return {
    summary: `今天真正推进的是：${completedText}。${openText}${projectSummary}`,
    nextActions: open
      .slice(0, 3)
      .map((task) => `- ${task.title}`)
      .join("\n"),
  };
}

export async function generateReviewDraft(input: {
  completed: Array<{ title: string; projectName: string | null }>;
  open: Array<{ title: string; projectName: string | null }>;
  planned: Array<{ title: string }>;
  projects: Array<{
    name: string;
    currentMilestone: string | null;
    taskCount: number;
  }>;
}, evidence?: string[]) {
  const fallback = heuristicReview(
    input.completed,
    input.open,
    input.planned,
    input.projects,
  );

  const text = await callModel(
    "你是下一步的每日复盘助手。根据当天完成的任务、今日计划、未完成任务和项目状态生成复盘草稿。summary 要像给朋友讲今天最重要的进展，不要只报数量，要包含一句明确洞察或判断；nextActions 每行一个下一步行动。只返回 JSON，不要 Markdown。格式：{\"summary\":\"总结\",\"nextActions\":\"每行一个下一步行动\"}。",
    JSON.stringify({ ...input, contextEvidence: evidence ?? [] }),
  );

  if (!text) return fallback;

  try {
    const raw = JSON.parse(extractJson(text) ?? "{}") as Partial<ReviewDraft>;
    if (
      typeof raw.summary === "string" &&
      typeof raw.nextActions === "string"
    ) {
      return {
        summary: raw.summary.trim(),
        nextActions: raw.nextActions.trim(),
      };
    }
  } catch {
    return fallback;
  }

  return fallback;
}
