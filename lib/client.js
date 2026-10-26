window.__ModuleLoader__.load({
	id: "dsh-cross-session-gated",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let jsxr = require("react/jsx-runtime");
		let primitives = require("@deepseek-ai/dsh-client-ui-primitives");

		const CONFIG_ENTRY = "cross-session-approval";
		const NS = "settings.crossSessionGated";

		const zh = {
			title: "跨会话（受限）",
			description: "控制模型能对哪些会话做什么：会话放行 + 工具开关。",
			sessionsTitle: "会话放行",
			sessionsHint: "两列独立：左边允许别人把它当目标，右边允许它的代理主动访问别人。子代理会话不列出。",
			colInbound: "能被访问",
			colOutbound: "能去访问",
			sessionsEmpty: "当前没有可选的会话。",
			advancedTitle: "高级：直接编辑 ID 列表",
			advancedHint: "每行一个 session-<uuid> 或 cs_ 别名；勾选会同步改写这里。",
			invalid: "请检查这一项的值。",
			overridden: "已覆盖",
			reset: "恢复默认",
			readOnly: "本部署的设置为只读。",
			unavailable: "该插件当前未加载，暂时无法配置。",
			save: "保存",
			saving: "保存中…",
			saveFailed: "本部署没有接受这些值，已保留供你修改。",
			toolsTitle: "工具开关",
			toolsHint: "关闭后该工具不会被注册：模型看不到它的名字，也没有任何调用途径。改完记得点保存；开关需重启 dsh web 才真正生效。",
			gSpawn: "创建新会话 spawn", gSpawnHint: "允许模型新建顶层会话并派活。",
			gSend: "发消息 send", gSendHint: "允许模型向指定会话投递消息。",
			gReply: "回信 reply", gReplyHint: "允许模型把结果回给指定会话。",
			gStatus: "派活状态 status", gStatusHint: "允许模型查看派活登记总览。",
			gRead: "读取会话 read", gReadHint: "允许模型读取其它会话的工作过程。",
			gList: "列出会话 list", gListHint: "允许模型枚举当前工作区的会话。",
			gBroadcast: "一对多 broadcast", gBroadcastHint: "允许模型一次向多个会话派发。",
			gRename: "重命名 rename", gRenameHint: "允许模型修改其它会话的标题。",
			gArchive: "归档 archive", gArchiveHint: "允许模型归档其它会话。",
			gApprove: "审批 approve", gApproveHint: "允许模型处理其它会话发起的提权审批。"
		};

		const en = {
			title: "Cross-session (gated)",
			description: "Control which sessions the model may touch and what it can do.",
			sessionsTitle: "Session access",
			sessionsHint: "Two independent columns: left lets others target it; right lets its agent reach others. Subagent sessions are not listed.",
			colInbound: "Reachable",
			colOutbound: "May reach",
			sessionsEmpty: "No sessions available right now.",
			advancedTitle: "Advanced: edit the ID lists directly",
			advancedHint: "One session-<uuid> or cs_ alias per line; toggles above rewrite these.",
			invalid: "Check this field.",
			overridden: "Overridden",
			reset: "Reset to default",
			readOnly: "This deployment stores settings read-only.",
			unavailable: "This plugin is not loaded, so it cannot be configured right now.",
			save: "Save",
			saving: "Saving…",
			saveFailed: "The deployment did not accept these values; they were left for you to correct.",
			toolsTitle: "Tool gates",
			toolsHint: "A disabled tool is not registered at all: the model never sees its name and has no way to call it. Remember to save; gate changes apply after restarting dsh web.",
			gSpawn: "Create session (spawn)", gSpawnHint: "Let the model create top-level sessions.",
			gSend: "Send message (send)", gSendHint: "Let the model deliver a message to a session.",
			gReply: "Reply (reply)", gReplyHint: "Let the model report a result back to a session.",
			gStatus: "Status (status)", gStatusHint: "Let the model read the dispatch registry.",
			gRead: "Read session (read)", gReadHint: "Let the model read another session's transcript tail.",
			gList: "List sessions (list)", gListHint: "Let the model enumerate sessions in the workspace.",
			gBroadcast: "Broadcast", gBroadcastHint: "Let the model dispatch to several sessions at once.",
			gRename: "Rename", gRenameHint: "Let the model rename other sessions.",
			gArchive: "Archive", gArchiveHint: "Let the model archive other sessions.",
			gApprove: "Approve", gApproveHint: "Let the model answer escalation requests from other sessions."
		};

		const GATES = [
			["allowSpawn", "gSpawn", "gSpawnHint"],
			["allowSend", "gSend", "gSendHint"],
			["allowReply", "gReply", "gReplyHint"],
			["allowStatus", "gStatus", "gStatusHint"],
			["allowRead", "gRead", "gReadHint"],
			["allowList", "gList", "gListHint"],
			["allowBroadcast", "gBroadcast", "gBroadcastHint"],
			["allowRename", "gRename", "gRenameHint"],
			["allowArchive", "gArchive", "gArchiveHint"],
			["allowApprove", "gApprove", "gApproveHint"]
		];

		// 两个会话白名单 + 10 个工具开关
		const FIELDS = ["allowedTargets", "allowedSources"].concat(GATES.map((g) => g[0]));

		function formLabels(t) {
			return {
				unavailable: t("unavailable"),
				readOnly: t("readOnly"),
				saveFailed: t("saveFailed"),
				save: t("save"),
				saving: t("saving")
			};
		}

		function fieldText(field) {
			if (!field) return "";
			if (typeof field.text === "string") return field.text;
			if (typeof field.value === "string") return field.value;
			return "";
		}

		function isOn(field) {
			return fieldText(field).trim().toLowerCase() === "true";
		}

		function parseIds(text) {
			return String(text || "")
				.split(/[\s,，;；]+/)
				.map((v) => v.trim())
				.filter(Boolean);
		}

		function shortId(id) {
			return String(id || "").replace(/^session-/, "").slice(0, 8);
		}

		function groupByCwd(rows) {
			const groups = new Map();
			for (const row of rows) {
				const key = row.cwd && row.cwd.trim() ? row.cwd.trim() : "—";
				if (!groups.has(key)) groups.set(key, []);
				groups.get(key).push(row);
			}
			return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
		}

		function Check(props) {
			const { checked, label, disabled, onChange } = props;
			return jsxr.jsxs("label", {
				style: {
					display: "inline-flex",
					alignItems: "center",
					gap: "4px",
					fontSize: "11px",
					opacity: disabled ? 0.45 : 0.9,
					cursor: disabled ? "not-allowed" : "pointer",
					userSelect: "none"
				},
				children: [
					jsxr.jsx("input", {
						type: "checkbox",
						checked,
						disabled,
						onChange: (e) => onChange(e.target.checked)
					}),
					jsxr.jsx("span", { children: label })
				]
			});
		}

		function Card(props) {
			const { t } = props;
			const state = props.useGatedCard((snapshot) => snapshot);
			if (props.view === "summary") return t("description");

			const disabled = state.writable === false || state.saving === true;
			const targets = new Set(parseIds(fieldText(state.allowedTargets)));
			const sources = new Set(parseIds(fieldText(state.allowedSources)));
			const choices = Array.isArray(state.sessionChoices) ? state.sessionChoices : [];

			function applySet(field, set) {
				props.edit(field, Array.from(set).join("\n"));
			}
			function toggle(field, current, id, on) {
				const next = new Set(current);
				if (on) next.add(id);
				else next.delete(id);
				applySet(field, next);
			}

			const gateRows = GATES.map(([key, labelKey, hintKey]) => jsxr.jsxs("label", {
				key,
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "12px",
					padding: "8px 0",
					borderBottom: "1px solid rgba(128,128,128,0.18)",
					cursor: disabled ? "not-allowed" : "pointer"
				},
				children: [
					jsxr.jsxs("span", {
						style: { display: "flex", flexDirection: "column", gap: "2px" },
						children: [
							jsxr.jsx("span", { children: t(labelKey) }),
							jsxr.jsx("span", { style: { fontSize: "11px", opacity: 0.65 }, children: t(hintKey) })
						]
					}),
					jsxr.jsx(primitives.Switch, {
						checked: isOn(state[key]),
						label: t(labelKey),
						disabled,
						onChange: (v) => props.edit(key, v ? "true" : "false")
					})
				]
			}));

			const groups = groupByCwd(choices);
			const sessionTree = choices.length === 0
				? jsxr.jsx("p", { style: { margin: "6px 0", fontSize: "12px", opacity: 0.6 }, children: t("sessionsEmpty") })
				: jsxr.jsx("div", { style: { display: "flex", flexDirection: "column", maxHeight: "300px", overflowY: "auto" }, children: groups.map(([cwd, rows]) => jsxr.jsxs("div", {
						key: cwd,
						children: [
							jsxr.jsx("div", {
								style: { fontSize: "11px", opacity: 0.55, padding: "8px 0 3px", borderBottom: "1px solid rgba(128,128,128,0.25)" },
								children: cwd
							}),
							rows.map((row) => jsxr.jsxs("div", {
								key: row.id,
								style: { display: "flex", alignItems: "center", gap: "10px", padding: "5px 0 5px 10px" },
								children: [
									jsxr.jsxs("span", {
										style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px" },
										children: [
											row.title || "(未命名)",
											jsxr.jsx("span", { style: { opacity: 0.45, fontSize: "10px", marginLeft: "6px" }, children: shortId(row.id) })
										]
									}),
									jsxr.jsx(Check, {
										checked: targets.has(row.id),
										label: t("colInbound"),
										disabled,
										onChange: (v) => toggle("allowedTargets", targets, row.id, v)
									}),
									jsxr.jsx(Check, {
										checked: sources.has(row.id),
										label: t("colOutbound"),
										disabled,
										onChange: (v) => toggle("allowedSources", sources, row.id, v)
									})
								]
							}))
						]
					}))
				});

			return jsxr.jsx(primitives.SettingsForm, {
				labels: formLabels(t),
				state,
				onSave: props.save,
				onDiscard: props.discard,
				children: jsxr.jsxs("div", {
					style: { display: "flex", flexDirection: "column", gap: "18px" },
					children: [
						jsxr.jsxs("section", {
							style: { display: "flex", flexDirection: "column", gap: "4px" },
							children: [
								jsxr.jsx("h3", { style: { margin: "4px 0", fontSize: "13px", fontWeight: 600 }, children: t("sessionsTitle") }),
								jsxr.jsx("p", { style: { margin: 0, fontSize: "11px", opacity: 0.65 }, children: t("sessionsHint") }),
								jsxr.jsx("p", { style: { margin: 0, fontSize: "10px", opacity: 0.45 }, children: "loaded " + String((state.sessionStats || {}).total ?? 0) + " / shown " + String(choices.length) + " / hidden " + String((state.sessionStats || {}).hidden ?? 0) }),
								sessionTree
							]
						}),
						jsxr.jsxs("section", {
							style: { display: "flex", flexDirection: "column", gap: "4px" },
							children: [
								jsxr.jsx("h3", { style: { margin: "4px 0", fontSize: "13px", fontWeight: 600 }, children: t("toolsTitle") }),
								jsxr.jsx("p", { style: { margin: 0, fontSize: "11px", opacity: 0.65 }, children: t("toolsHint") }),
								jsxr.jsx("div", { style: { display: "flex", flexDirection: "column" }, children: gateRows })
							]
						}),
						jsxr.jsxs("details", {
							style: { fontSize: "12px" },
							children: [
								jsxr.jsx("summary", { style: { cursor: "pointer", opacity: 0.75 }, children: t("advancedTitle") }),
								jsxr.jsx("p", { style: { margin: "6px 0", fontSize: "11px", opacity: 0.6 }, children: t("advancedHint") }),
								jsxr.jsx(primitives.SettingsValueField, {
									id: "plugin-config-gated-targets",
									label: t("colInbound"),
									hint: t("advancedHint"),
									overriddenLabel: t("overridden"),
									resetLabel: t("reset"),
									invalidLabel: t("invalid"),
									disabled,
									text: fieldText(state.allowedTargets),
									overridden: (state.allowedTargets || {}).overridden === true,
									invalid: (state.allowedTargets || {}).invalid === true,
									onEdit: (text) => props.edit("allowedTargets", text),
									onReset: () => props.resetField("allowedTargets")
								}),
								jsxr.jsx(primitives.SettingsValueField, {
									id: "plugin-config-gated-sources",
									label: t("colOutbound"),
									hint: t("advancedHint"),
									overriddenLabel: t("overridden"),
									resetLabel: t("reset"),
									invalidLabel: t("invalid"),
									disabled,
									text: fieldText(state.allowedSources),
									overridden: (state.allowedSources || {}).overridden === true,
									invalid: (state.allowedSources || {}).invalid === true,
									onEdit: (text) => props.edit("allowedSources", text),
									onReset: () => props.resetField("allowedSources")
								})
							]
						})
					]
				})
			});
		}

		var Controller = class {
			constructor(scope, sessions) {
				this.sessions = sessions;
				this.form = new primitives.SettingsFormModel(scope, FIELDS.map((k) => primitives.settingsTextField(k)));
				this.store = this.form.bind(() => this.projection());
			}
			projection() {
				const out = Object.assign({}, this.form.shell());
				for (const key of FIELDS) out[key] = this.form.field(key);
				const picked = this.choiceRows();
				out.sessionChoices = picked.rows;
				out.sessionStats = picked.stats;
				return out;
			}
			choiceRows() {
				const stats = { total: 0, hidden: 0 };
				try {
					const snapshot = this.sessions.list.getSnapshot();
					const ids = Array.isArray(snapshot.ids) ? snapshot.ids : Object.keys(snapshot.byId || {});
					const rows = [];
					for (const id of ids) {
						const row = (snapshot.byId || {})[id] || {};
						if (row.blank === true) continue;
						stats.total += 1;
						if (row.origin === "subagent" || row.origin === "fork") { stats.hidden += 1; continue; }
						if (row.subagent === true) { stats.hidden += 1; continue; }
						if (row.parentId !== undefined && row.parentId !== null && row.parentId !== "") { stats.hidden += 1; continue; }
						if (row.archived === true || row.deleted === true || row.hidden === true) { stats.hidden += 1; continue; }
						const title = typeof row.title === "string" ? row.title.trim() : "";
						if (/^<system-reminder>/i.test(title) || /^You are teammate\b/i.test(title)) { stats.hidden += 1; continue; }
						rows.push({
							id: String(row.id || id),
							title,
							cwd: String(row.cwd || row.workspaceId || ""),
							running: row.running === true
						});
					}
					rows.sort((a, b) => (b.running ? 1 : 0) - (a.running ? 1 : 0) || a.title.localeCompare(b.title));
					return { rows, stats };
				} catch {
					return { rows: [], stats };
				}
			}
			refresh() {
				this.form.publish();
			}
			inject() {
				return Object.assign({ hooks: { gatedCard: this.store } }, this.form.actions());
			}
			dispose() {
				this.form.dispose();
			}
		};

		const inject = ["slots", "locale", "configForms", "sessions"];

		function apply(ctx) {
			const t = ctx.locale.bind(NS);
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "ui-cross-session-gated: dictionaries");
			const card = new Controller(ctx.configForms.get(CONFIG_ENTRY), ctx.sessions);
			ctx.effect(() => () => {
				card.dispose();
			}, "ui-cross-session-gated: form subscription");
			ctx.effect(() => {
				const dispose = ctx.sessions.list.subscribe(() => card.refresh());
				return () => dispose();
			}, "ui-cross-session-gated: session list");
			ctx.effect(() => ctx.configForms.whileServed([CONFIG_ENTRY], () => ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
				name: "plugins.bundle.config",
				key: "dsh-cross-session-gated",
				locale: NS,
				inject: () => card.inject()
			}, Card))), "ui-cross-session-gated: page");
		}

		exports.NS = NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
