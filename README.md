# dsh-cross-session-gated

> DeepSeek Harness 的**受限版**跨会话插件：工具级开关 + 全局会话白名单。

Fork 自 [zsjs110110-cpu/dsh-cross-session-approval](https://github.com/zsjs110110-cpu/dsh-cross-session-approval)（MIT）。
保留原有的派活 / 审批桥 / 权限夹紧能力，在其上增加两件事：

1. **工具级开关** —— 关掉某个工具，它**根本不会被注册**。模型在工具列表里看不到它，没有任何调用途径，不是"调用后被拒绝"。
2. **全局会话白名单** —— 只有名单内的会话能被任何工具寻址，名单外一律报错拒绝。

## 与上游的差别

| 能力 | 上游 | 本 fork |
| --- | --- | --- |
| 创建新会话 spawn | 始终存在 | **可关闭**（默认关） |
| 一对多 broadcast | 始终存在 | **可关闭**（默认关） |
| 读取任意会话 read | 始终存在 | **可关闭**（默认关） |
| 枚举会话 list | 始终存在 | **可关闭**（默认关） |
| 指定之外的会话 | 全部可达 | **白名单外一律拒绝** |

默认值刻意保守：只有 `send` / `reply` / `status` 打开。

## 安装

### 方式一：从 Release 手动装

1. 从 [Releases](https://github.com/Cong0707/dsh-cross-session-gated/releases) 下载 `dsh-cross-session-gated-0.1.0.tgz`。
2. 解压到 profile 的 `node_modules`：

```powershell
$dir = Join-Path $HOME ".dsh/profiles/web/node_modules/dsh-cross-session-gated"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
tar -xzf dsh-cross-session-gated-0.1.0.tgz -C $dir --strip-components=1
```

3. 在 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles` 里**追加**包名：

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "...",
        "dsh-cross-session-gated"
      ]
    }
  }
}
```

4. 重启 `dsh web`。

### 方式二：从 Git 装

```powershell
dsh plugin add https://github.com/Cong0707/dsh-cross-session-gated
```

## 配置

写在 `~/.dsh/profiles/web/cordis.patch.yml` 的条目里，或直接在 **插件页 → 本插件 → 配置** 里改。

```yaml
- insert:
    - id: cross-session-approval
      name: 'dsh-cross-session-gated'
      config:
        stateDir: .cross-session
        allowedSessions: ''          # 每行一个 session-<uuid> 或 cs_ 别名
        allowSpawn: 'false'
        allowSend: 'true'
        allowReply: 'true'
        allowStatus: 'true'
        allowRead: 'false'
        allowList: 'false'
        allowBroadcast: 'false'
        allowRename: 'false'
        allowArchive: 'false'
        allowApprove: 'false'
        spawnPermission: cap
        forkPermission: cap
```

### 字段说明

| 字段 | 说明 | 默认 |
| --- | --- | --- |
| `allowedSessions` | 全局会话白名单，每行一个真实 id 或 `cs_` 别名 | 空（不限制） |
| `allowSpawn` | 创建新会话 | false |
| `allowSend` | 向会话发消息 | true |
| `allowReply` | 向会话回信 | true |
| `allowStatus` | 查看派活登记 | true |
| `allowRead` | 读取会话内容 | false |
| `allowList` | 列出会话 | false |
| `allowBroadcast` | 一对多派发 | false |
| `allowRename` | 重命名会话 | false |
| `allowArchive` | 归档会话 | false |
| `allowApprove` | 处理跨会话提权审批 | false |
| `spawnPermission` | 子会话权限夹紧：`cap` / `off` | cap |
| `forkPermission` | 派生入口夹紧：`cap` / `strict` / `off` | cap |

布尔值接受 `true`/`false`、`1`/`0`、`on`/`off`、`yes`/`no`（大小写不敏感）。

## 生效时机

| 改动 | 何时生效 |
| --- | --- |
| `allowedSessions` | **立即**（每次调用实时求值） |
| 工具开关 `allow*` | **重启 `dsh web` 后**（注册发生在插件加载时） |

工具开关必须重启，是因为"不注册"这个动作只在 apply 阶段发生一次 —— 这正是它能做到硬隔离的原因。

## 白名单里填什么

会话 ID 形如 `session-<uuid>`。获取途径：

- `~/.dsh/sessions/<escaped-cwd>/<uuid>/session.jsonl.zstd` 的目录名，前面加 `session-`
- 让模型调用 `cross_session_list`（需先打开 `allowList`）然后抄 `cs_` 别名

`cs_` 别名是真实 id 的确定性派生（FNV-1a + base62），重启不变，但它**不是授权凭据** —— 校验始终针对解析后的真实 id。

## 注意

- 登记表写在 `<工作区>/.cross-session/registry.json`，含任务正文与回信摘要，可能敏感。
- 白名单空着等于**不限制**。生产环境请至少填上允许的那几个会话。
- 本 fork 未改动上游的审批桥 / 权限夹紧逻辑，相关边界见上游 README。

## License

MIT（沿用上游）。
