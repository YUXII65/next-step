import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

const root = path.resolve(import.meta.dirname, "..");
const corpusPath = path.join(root, "scripts", "ai-eval-corpus.json");
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8"));

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const model =
  process.env.DEEPSEEK_MODEL ||
  process.env.OPENAI_MODEL ||
  "deepseek-chat";
const baseUrl = (
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
).replace(/\/$/, "");

if (!apiKey) {
  console.error("Missing AI API key. Set DEEPSEEK_API_KEY or OPENAI_API_KEY.");
  process.exit(1);
}

const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : corpus.cases.length;
const labelArg = args.find((arg) => arg.startsWith("--label="));
const label = labelArg ? labelArg.split("=")[1].trim() : "";
const compareArg = args.find((arg) => arg.startsWith("--compare="));
const comparePath = compareArg
  ? path.resolve(root, compareArg.split("=")[1])
  : null;
const fileBase = label ? `ai-eval-baseline-${label}` : "ai-eval-baseline";
const reportPath = path.join(root, "docs", `${fileBase}.md`);
const resultsPath = path.join(root, "docs", `${fileBase}.json`);

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

async function callPlan(aiCase) {
  const context = aiCase.context ?? {};
  const projects = context.projects ?? [];
  const maxTasks = aiCase.checks?.maxTasks ?? 5;
  const system = `你是下一步的计划助手。今天是 ${new Date().toLocaleDateString(
    "sv-SE",
  )}。用户会输入一个随意想法，你需要把它整理成一个可执行计划。只返回 JSON，不要 Markdown。字段：action 必须是 create_project、existing_project、single_task、ignore 之一；projectName 只能从给定项目中选择，若新建项目则给一个简洁名称；projectObjective 是项目目标；projectMilestone 是当前里程碑；tasks 是 1-5 条任务，每项包含 title、notes、priority、scheduledDate、dueDate；reason 用中文说明计划理由。日期格式是 YYYY-MM-DD 或 null。所有日期必须基于今天，不能使用训练数据中的旧日期。如果 maxTasks 存在，tasks 数量必须小于或等于 maxTasks；当输入里出现多个目标时，也要遵守 maxTasks。如果 contextEvidence 有内容，reason 必须引用其中至少一条真实依据。如果 memorySummary 中有用户偏好或规划提示，必须遵守。首条任务应该是今天或明天能启动的最小动作。`;

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
        {
          role: "user",
          content: JSON.stringify({
            content: aiCase.input,
            projectNames: projects.map((project) => project.name),
            projects,
            memorySummary: context.memorySummary ?? null,
            dimensionChoices: [],
            contextEvidence: context.evidence ?? [],
            maxTasks,
          }),
        },
      ],
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function runChecks(aiCase, plan) {
  const checks = aiCase.checks ?? {};
  const failures = [];

  if (!plan || typeof plan !== "object") {
    failures.push("plan 不是有效 JSON 对象");
    return failures;
  }

  if (!Array.isArray(plan.tasks) || plan.tasks.length < 1) {
    failures.push("tasks 必须至少包含 1 条");
  }

  if (Array.isArray(plan.tasks)) {
    if (checks.maxTasks && plan.tasks.length > checks.maxTasks) {
      failures.push(`任务数 ${plan.tasks.length} 超过上限 ${checks.maxTasks}`);
    }
    for (const task of plan.tasks) {
      if (!task || typeof task.title !== "string" || !task.title.trim()) {
        failures.push("存在空任务标题");
        break;
      }
    }
  }

  if (typeof plan.reason !== "string" || !plan.reason.trim()) {
    failures.push("reason 不能为空");
  }

  if (checks.mustMentionProject) {
    const text = JSON.stringify(plan);
    if (!text.includes(checks.mustMentionProject)) {
      failures.push(`计划没有提到项目“${checks.mustMentionProject}”`);
    }
  }

  return failures;
}

const rows = [];
const now = new Date().toISOString();

for (const [index, aiCase] of corpus.cases.entries()) {
  if (index >= limit) break;
  let plan = null;
  let error = null;

  try {
    const raw = await callPlan(aiCase);
    plan = JSON.parse(extractJson(raw) ?? "{}");
  } catch (caught) {
    error = caught.message;
  }

  const failures = error ? [error] : runChecks(aiCase, plan);
  rows.push({
    id: aiCase.id,
    title: aiCase.title,
    action: plan?.action ?? null,
    taskCount: Array.isArray(plan?.tasks) ? plan.tasks.length : 0,
    reason: plan?.reason ?? "",
    failures,
    pass: failures.length === 0,
  });
}

const passed = rows.filter((row) => row.pass).length;
const failed = rows.length - passed;
const summary = [
  "# AI 评测基线",
  "",
  `> 生成时间：${now}`,
  `> 模型：${model}`,
  `> 用例数：${rows.length}，通过：${passed}，失败：${failed}`,
  "",
  "## 结果",
  "",
  "| 用例 | 结果 | action | 任务数 | 说明 |",
  "| --- | --- | --- | --- | --- |",
  ...rows.map(
    (row) =>
      `| ${row.title} | ${row.pass ? "通过" : "失败"} | ${
        row.action ?? "-"
      } | ${row.taskCount} | ${
        row.failures.length
          ? row.failures.join("；")
          : row.reason.slice(0, 80)
      } |`,
  ),
  "",
  "## 说明",
  "",
  "这是自动化结构检查基线，不等同于人工质量评分。每次修改 prompt、上下文或模型后重新运行，观察失败项是否新增。",
  "",
].join("\n");

fs.writeFileSync(reportPath, summary, "utf8");
fs.writeFileSync(
  resultsPath,
  JSON.stringify(
    {
      generatedAt: now,
      model,
      rows,
    },
    null,
    2,
  ),
  "utf8",
);

if (comparePath) {
  let previousRows = [];
  try {
    const previous = JSON.parse(fs.readFileSync(comparePath, "utf8"));
    previousRows = previous.rows ?? [];
  } catch {
    console.warn(`Cannot read compare file: ${comparePath}`);
  }
  const previousById = new Map(
    previousRows.map((row) => [row.id, row]),
  );
  for (const row of rows) {
    const previous = previousById.get(row.id);
    if (!previous) {
      console.log(`NEW ${row.id}`);
    } else if (
      previous.pass !== row.pass ||
      previous.taskCount !== row.taskCount
    ) {
      console.log(
        `CHANGED ${row.id}: ${previous.pass ? "通过" : "失败"} ${
          previous.taskCount
        } -> ${row.pass ? "通过" : "失败"} ${row.taskCount}`,
      );
    }
  }
}

for (const row of rows) {
  console.log(
    `${row.pass ? "PASS" : "FAIL"} ${row.id} | ${
      row.failures.length ? row.failures.join("; ") : row.reason
    }`,
  );
}

console.log(`\nBaseline: ${passed}/${rows.length} passed`);
process.exit(failed ? 1 : 0);
