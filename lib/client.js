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
			description: "控制模型能对哪些会话做什么：工具开关 + 全局会话白名单。关闭的工具不会注册，模型完全看不到。",
			allowlist: "全局会话白名单",
			allowlistHint: "每行一个 session-<uuid> 或 cs_ 别名。留空表示不限制（不推荐）。只有名单内的会话能被任何工具寻址。",
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
			description: "Control which sessions the model can touch and what it can do: tool gates plus a global allowlist. Disabled tools are never registered.",
			allowlist: "Global session allowlist",
			allowlistHint: "One session-<uuid> or cs_ alias per line. Empty means unrestricted (not recommended). Only listed sessions can be addressed by any tool.",
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

		const FIELDS = ["allowedSessions"].concat(GATES.map((g) => g[0]));

		function formLabels(t) {
			return {
				unavailable: t("unavailable"),
				readOnly: t("readOnly"),
				saveFailed: t("saveFailed"),
				save: t("save"),
				saving: t("saving")
			};
		}

		// field() 返回 { text, overridden, invalid } —— 没有 value 字段
		function fieldText(field) {
			if (!field) return "";
			if (typeof field.text === "string") return field.text;
			if (typeof field.value === "string") return field.value;
			return "";
		}

		function isOn(field) {
			return fieldText(field).trim().toLowerCase() === "true";
		}

		function Card(props) {
			const { t } = props;
			const state = props.useGatedCard((snapshot) => snapshot);
			if (props.view === "summary") return t("description");

			// writable 可能是 undefined：只有明确 false 才禁用
			const disabled = state.writable === false || state.saving === true;
			const allowlistField = state.allowedSessions || {};

			const rows = GATES.map(([key, labelKey, hintKey]) => jsxr.jsxs("label", {
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
						onChange: (checked) => props.edit(key, checked ? "true" : "false")
					})
				]
			}));

			return jsxr.jsx(primitives.SettingsForm, {
				labels: formLabels(t),
				state,
				onSave: props.save,
				onDiscard: props.discard,
				children: jsxr.jsxs("div", {
					style: { display: "flex", flexDirection: "column", gap: "16px" },
					children: [
						jsxr.jsx(primitives.SettingsValueField, {
							id: "plugin-config-gated-allowlist",
							label: t("allowlist"),
							hint: t("allowlistHint"),
							overriddenLabel: t("overridden"),
							resetLabel: t("reset"),
							invalidLabel: t("invalid"),
							disabled,
							text: fieldText(allowlistField),
							overridden: allowlistField.overridden === true,
							invalid: allowlistField.invalid === true,
							onEdit: (text) => props.edit("allowedSessions", text),
							onReset: () => props.resetField("allowedSessions")
						}),
						jsxr.jsxs("section", {
							style: { display: "flex", flexDirection: "column", gap: "4px" },
							children: [
								jsxr.jsx("h3", { style: { margin: "4px 0", fontSize: "13px", fontWeight: 600 }, children: t("toolsTitle") }),
								jsxr.jsx("p", { style: { margin: 0, fontSize: "11px", opacity: 0.65 }, children: t("toolsHint") }),
								jsxr.jsx("div", { style: { display: "flex", flexDirection: "column" }, children: rows })
							]
						})
					]
				})
			});
		}

		var Controller = class {
			constructor(scope) {
				this.form = new primitives.SettingsFormModel(scope, FIELDS.map((k) => primitives.settingsTextField(k)));
				this.store = this.form.bind(() => this.projection());
			}
			projection() {
				const out = Object.assign({}, this.form.shell());
				for (const key of FIELDS) out[key] = this.form.field(key);
				return out;
			}
			inject() {
				return Object.assign({ hooks: { gatedCard: this.store } }, this.form.actions());
			}
			dispose() {
				this.form.dispose();
			}
		};

		const inject = ["slots", "locale", "configForms"];

		function apply(ctx) {
			const t = ctx.locale.bind(NS);
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "ui-cross-session-gated: dictionaries");
			const card = new Controller(ctx.configForms.get(CONFIG_ENTRY));
			ctx.effect(() => () => {
				card.dispose();
			}, "ui-cross-session-gated: form subscription");
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
