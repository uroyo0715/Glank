using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Glank
{
    /// <summary>
    /// ホットキーを押した瞬間に仮のタイトルで即送信するのではなく、QA担当がタイトル・タグ・詳細・
    /// 優先度を入力してから送信できるようにする簡易フォーム。
    ///
    /// <see cref="panelRoot"/>が未設定の場合（Setup Wizardから導入した場合）、Canvas/EventSystem/
    /// 入力欄一式を起動時にコードから自動生成する（<see cref="GlankReporterNamePrompt"/>と同じ方針）。
    /// 見た目を自分で作り込みたい場合だけ、Hierarchyを手動で組んで各フィールドにアサインすれば、
    /// 自動生成は行われずそちらが使われる（組み方はunity-sdk/README.mdを参照）。
    /// レガシーUI（UnityEngine.UI）のみを使い、TextMeshPro等の追加パッケージには依存しない
    /// （SDK全体の「依存パッケージなし」という方針に合わせている）。
    /// </summary>
    public class GlankReportPromptUI : MonoBehaviour
    {
        /// <summary>フォームに出すタグ1件分。<see cref="value"/>がサーバーに送られる文字列、<see cref="label"/>がフォームの表示。</summary>
        [Serializable]
        public class TagOption
        {
            public string value;
            public string label;

            public TagOption() { }

            public TagOption(string value, string label)
            {
                this.value = value;
                this.label = label;
            }
        }

        [Tooltip("未設定ならこのコンポーネントと同じGameObjectの BugReportTrigger を使う。")]
        [SerializeField] private BugReportTrigger trigger;

        [Tooltip("手動でHierarchyを組んだ場合のフォーム本体。未設定ならUI一式を実行時に自動生成する。")]
        [SerializeField] private GameObject panelRoot;

        [Tooltip(
            "フォームに出すタグの選択肢（複数選択できる）。+ボタンで自由に追加・削除・並べ替えできる。\n" +
            "value = サーバーに送る文字列（Webのタグ絞り込み・集計はこの文字列で行われる）\n" +
            "label = フォームに表示する文字列（空ならvalueをそのまま表示）\n" +
            "サーバーは任意の文字列をタグとして受け付ける。なお CrashDetector は \"crash\"、" +
            "FreezeWatchdog は \"softlock\" というvalueで報告するため、自動検知の報告とまとめて" +
            "集計したい場合はこの2つのvalueは変えない。")]
        [SerializeField] private List<TagOption> tagOptions = new List<TagOption>
        {
            new TagOption("crash", "クラッシュ"),
            new TagOption("visual", "見た目"),
            new TagOption("softlock", "進行不能"),
        };

        [SerializeField] private InputField titleField;
        [Tooltip("手動Hierarchy用。選択肢の並び順は tagOptions と同じ（既定は0:crash 1:visual 2:softlock）。" +
            "Dropdownは単一選択のため、複数タグを付けたい場合は自動生成のフォームを使う。")]
        [SerializeField] private Dropdown tagDropdown;
        [SerializeField] private InputField descField;
        [Tooltip("「誰が報告したか」欄（任意）。未設定なら報告者名の入力機能自体を使わない。" +
            "空欄のまま送信すると、これまで設定した報告者名（無ければ端末名）を使う。")]
        [SerializeField] private InputField reporterNameField;
        [Tooltip("選択肢の並び順は0:high 1:medium 2:low を想定")]
        [SerializeField] private Dropdown priorityDropdown;
        [SerializeField] private Button submitButton;
        [SerializeField] private Button cancelButton;

        [Tooltip("フォームを開いている間、Time.timeScaleを0にしてゲームを一時停止する。" +
            "入力欄に打った文字でゲーム側の操作が反応してしまうのを防ぐ。" +
            "ゲーム側で独自に一時停止を管理している場合はOFFにする。")]
        [SerializeField] private bool pauseGameWhileOpen = true;

        // サーバーに送る値（API仕様どおりの固定値）と、自動生成フォームでの表示名。
        private static readonly string[] PriorityValues = { "high", "medium", "low" };
        private static readonly string[] PriorityLabels = { "高", "中", "低" };
        private const int DefaultPriorityIndex = 1; // medium

        private const int SortingOrder = 29000; // GlankReporterNamePrompt(30000)より下
        private const int ChoiceColumns = 3;
        private static readonly Color ChoiceUnselectedColor = new Color(1f, 1f, 1f, 1f);
        private static readonly Color ChoiceSelectedColor = new Color(0.35f, 0.55f, 0.95f, 1f);

        // 実行時生成モードでのみ使う（手動Hierarchyモードでは Dropdown の値を使う）。
        private bool[] _tagSelected;
        private int _priorityIndex = DefaultPriorityIndex;
        private Image[] _tagChoiceImages;
        private Image[] _priorityChoiceImages;

        private bool _pausedByThis;
        private float _previousTimeScale = 1f;

        private void Awake()
        {
            if (trigger == null) trigger = GetComponent<BugReportTrigger>();

            if (panelRoot == null) BuildRuntimeUI();

            if (submitButton != null) submitButton.onClick.AddListener(Submit);
            if (cancelButton != null) cancelButton.onClick.AddListener(Hide);
            Hide();
        }

        private void OnDisable()
        {
            RestoreTimeScale();
        }

        /// <summary>フォームを表示する。<see cref="pauseGameWhileOpen"/>がONなら開いている間ゲームを一時停止する。</summary>
        public void Show()
        {
            // 開いている間にもう一度ホットキーが押されても、入力中の内容を消さない。
            if (IsVisible) return;

            if (titleField != null) titleField.text = "";
            if (descField != null) descField.text = "";
            // 報告者名は前回設定した値を引き継いで表示する（毎回入力し直さなくていいように）。
            if (reporterNameField != null) reporterNameField.text = GlankReporterIdentity.GetReporterName();

            ResetTagSelection();
            SetPriority(DefaultPriorityIndex);

            if (panelRoot != null) panelRoot.SetActive(true);

            if (pauseGameWhileOpen && !_pausedByThis)
            {
                _previousTimeScale = Time.timeScale;
                Time.timeScale = 0f;
                _pausedByThis = true;
            }
        }

        public void Hide()
        {
            if (panelRoot != null) panelRoot.SetActive(false);
            RestoreTimeScale();
        }

        public bool IsVisible => panelRoot != null && panelRoot.activeSelf;

        private void RestoreTimeScale()
        {
            if (!_pausedByThis) return;
            Time.timeScale = _previousTimeScale;
            _pausedByThis = false;
        }

        private void Submit()
        {
            if (trigger == null)
            {
                Debug.LogError("[Glank] GlankReportPromptUI: triggerが未設定です。");
                return;
            }

            string title = titleField != null && !string.IsNullOrWhiteSpace(titleField.text)
                ? titleField.text
                : "(no title)";
            string[] tags = CollectSelectedTags();
            string desc = descField != null ? descField.text : "";
            int priorityIndex = priorityDropdown != null ? priorityDropdown.value : _priorityIndex;
            string priority = PriorityValues[Mathf.Clamp(priorityIndex, 0, PriorityValues.Length - 1)];

            if (reporterNameField != null && !string.IsNullOrWhiteSpace(reporterNameField.text))
            {
                GlankReporterIdentity.SetReporterName(reporterNameField.text);
            }

            trigger.SubmitReport(
                title: title,
                tags: tags,
                desc: desc,
                who: GlankReporterIdentity.GetReporterName(),
                build: Application.version,
                platform: GlankPlayerPlatform.GetPlatform(),
                priority: priority);

            Hide();
        }

        // ==== タグ ====

        /// <summary>tagOptionsのうちvalueが空でないものだけ（空は無視）。全部空なら既定の3つに戻す。</summary>
        private List<TagOption> GetUsableTagOptions()
        {
            var result = new List<TagOption>();
            if (tagOptions != null)
            {
                foreach (var option in tagOptions)
                {
                    if (option != null && !string.IsNullOrWhiteSpace(option.value)) result.Add(option);
                }
            }
            if (result.Count == 0)
            {
                result.Add(new TagOption("crash", "クラッシュ"));
                result.Add(new TagOption("visual", "見た目"));
                result.Add(new TagOption("softlock", "進行不能"));
            }
            return result;
        }

        private string[] CollectSelectedTags()
        {
            var options = GetUsableTagOptions();
            var selected = new List<string>();

            if (tagDropdown != null)
            {
                int index = Mathf.Clamp(tagDropdown.value, 0, options.Count - 1);
                selected.Add(options[index].value.Trim());
            }
            else if (_tagSelected != null)
            {
                for (int i = 0; i < options.Count && i < _tagSelected.Length; i++)
                {
                    if (_tagSelected[i]) selected.Add(options[i].value.Trim());
                }
            }

            // サーバーはタグが1つも無い報告を400で拒否するため、最低1つは必ず付ける。
            if (selected.Count == 0) selected.Add(options[0].value.Trim());
            return selected.ToArray();
        }

        private void ResetTagSelection()
        {
            if (_tagSelected == null) return;
            for (int i = 0; i < _tagSelected.Length; i++) _tagSelected[i] = i == 0;
            RefreshTagColors();
        }

        private void ToggleTag(int index)
        {
            if (_tagSelected == null || index < 0 || index >= _tagSelected.Length) return;

            // 最後の1つは外せない（タグ0件では送信できないため）。
            if (_tagSelected[index])
            {
                int count = 0;
                foreach (bool b in _tagSelected) if (b) count++;
                if (count <= 1) return;
            }

            _tagSelected[index] = !_tagSelected[index];
            RefreshTagColors();
        }

        private void RefreshTagColors()
        {
            if (_tagChoiceImages == null || _tagSelected == null) return;
            for (int i = 0; i < _tagChoiceImages.Length && i < _tagSelected.Length; i++)
            {
                _tagChoiceImages[i].color = _tagSelected[i] ? ChoiceSelectedColor : ChoiceUnselectedColor;
            }
        }

        private void SetPriority(int index)
        {
            _priorityIndex = index;
            if (_priorityChoiceImages == null) return;
            for (int i = 0; i < _priorityChoiceImages.Length; i++)
            {
                _priorityChoiceImages[i].color = i == index ? ChoiceSelectedColor : ChoiceUnselectedColor;
            }
        }

        // ==== 以下、実行時UI生成 ====
        // Setup Wizardがこのコンポーネントを付けるだけで動くよう、Canvas/EventSystem/入力欄一式を
        // コードから組み立てる（プロジェクト側でHierarchyを手動で組む必要をなくすため）。
        // タグ・優先度はDropdown（テンプレート用の子階層とスプライトが必要）ではなく、
        // GlankReporterNamePromptのプラットフォーム選択と同じ横並びのボタンで選ばせる。
        // タグの数に応じてパネルの高さが変わるため、上から順に配置していく。

        private void BuildRuntimeUI()
        {
            EnsureEventSystemExists();
            var font = GetDefaultFont();

            var canvasRoot = new GameObject("GlankReportPromptCanvas",
                typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasRoot.transform.SetParent(transform, false);

            var canvas = canvasRoot.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = SortingOrder;
            canvas.pixelPerfect = true;

            var scaler = canvasRoot.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ConstantPixelSize;
            scaler.scaleFactor = 1f;

            // 背景全体を薄暗くしつつクリックを吸収し、開いている間はゲーム本体側を操作できないようにする。
            var overlay = CreateUIObject("Overlay", canvasRoot.transform);
            StretchFull(overlay);
            overlay.AddComponent<Image>().color = new Color(0f, 0f, 0f, 0.5f);

            var panel = CreateUIObject("Panel", overlay.transform);
            var panelRect = SetupAnchoredRect(panel, new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(420f, 520f));
            panelRect.pivot = new Vector2(0.5f, 0.5f);
            panel.AddComponent<Image>().color = new Color(0.15f, 0.15f, 0.17f, 0.97f);

            var top = new Vector2(0.5f, 1f);
            const float contentWidth = 380f;
            const float labelHeight = 20f;
            const float labelGap = 22f;
            const float sectionGap = 12f;

            float y = -20f;
            CreateText(panel.transform, font, "バグを報告", top, new Vector2(0f, y), new Vector2(contentWidth, 28f), 18,
                TextAnchor.MiddleCenter);
            y -= 36f;

            CreateText(panel.transform, font, "タイトル", top, new Vector2(0f, y), new Vector2(contentWidth, labelHeight), 13,
                TextAnchor.MiddleLeft);
            y -= labelGap;
            titleField = CreateInputField(panel.transform, font, top, new Vector2(0f, y), new Vector2(contentWidth, 36f),
                "バグの概要", false);
            y -= 36f + sectionGap;

            CreateText(panel.transform, font, "タグ（複数選べます）", top, new Vector2(0f, y),
                new Vector2(contentWidth, labelHeight), 13, TextAnchor.MiddleLeft);
            y -= labelGap;
            var tagList = GetUsableTagOptions();
            var tagLabels = new string[tagList.Count];
            for (int i = 0; i < tagList.Count; i++)
            {
                tagLabels[i] = string.IsNullOrWhiteSpace(tagList[i].label) ? tagList[i].value : tagList[i].label;
            }
            _tagSelected = new bool[tagList.Count];
            float tagGridHeight;
            _tagChoiceImages = BuildChoiceGrid(panel.transform, font, tagLabels, y, ToggleTag, out tagGridHeight);
            y -= tagGridHeight + sectionGap;

            CreateText(panel.transform, font, "詳細", top, new Vector2(0f, y), new Vector2(contentWidth, labelHeight), 13,
                TextAnchor.MiddleLeft);
            y -= labelGap;
            descField = CreateInputField(panel.transform, font, top, new Vector2(0f, y), new Vector2(contentWidth, 100f),
                "何が起きたか・再現手順", true);
            y -= 100f + sectionGap;

            CreateText(panel.transform, font, "優先度", top, new Vector2(0f, y), new Vector2(contentWidth, labelHeight), 13,
                TextAnchor.MiddleLeft);
            y -= labelGap;
            float priorityGridHeight;
            _priorityChoiceImages = BuildChoiceGrid(panel.transform, font, PriorityLabels, y, SetPriority,
                out priorityGridHeight);
            y -= priorityGridHeight + sectionGap;

            CreateText(panel.transform, font, "報告者名", top, new Vector2(0f, y), new Vector2(contentWidth, labelHeight), 13,
                TextAnchor.MiddleLeft);
            y -= labelGap;
            reporterNameField = CreateInputField(panel.transform, font, top, new Vector2(0f, y),
                new Vector2(contentWidth, 36f), "名前（任意）", false);
            y -= 36f + 18f;

            cancelButton = CreateButton(panel.transform, font, "キャンセル", top, new Vector2(-98f, y),
                new Vector2(180f, 40f));
            submitButton = CreateButton(panel.transform, font, "送信", top, new Vector2(98f, y),
                new Vector2(180f, 40f));
            y -= 40f + 20f;

            panelRect.sizeDelta = new Vector2(420f, -y);

            panelRoot = canvasRoot;
            ResetTagSelection();
            SetPriority(DefaultPriorityIndex);
        }

        /// <summary>
        /// ボタンを<see cref="ChoiceColumns"/>列のグリッドに並べる（左上から右→下の順）。
        /// 押されたボタンの添字を<paramref name="onSelect"/>に渡す。色（選択状態）は呼び出し側が管理する。
        /// </summary>
        private static Image[] BuildChoiceGrid(Transform parent, Font font, string[] labels, float topY,
            Action<int> onSelect, out float totalHeight)
        {
            const float buttonWidth = 122f;
            const float buttonHeight = 32f;
            const float spacingX = 7f;
            const float spacingY = 6f;

            int columns = Mathf.Min(ChoiceColumns, Mathf.Max(1, labels.Length));
            int rows = (labels.Length + columns - 1) / columns;
            float rowWidth = columns * buttonWidth + (columns - 1) * spacingX;
            float startX = -rowWidth / 2f + buttonWidth / 2f;
            totalHeight = rows * buttonHeight + (rows - 1) * spacingY;

            var images = new Image[labels.Length];
            for (int i = 0; i < labels.Length; i++)
            {
                int row = i / columns;
                int col = i % columns;
                float x = startX + col * (buttonWidth + spacingX);
                float yPos = topY - row * (buttonHeight + spacingY);

                var button = CreateButton(parent, font, labels[i],
                    new Vector2(0.5f, 1f), new Vector2(x, yPos), new Vector2(buttonWidth, buttonHeight));
                int captured = i;
                button.onClick.AddListener(() => onSelect(captured));
                images[i] = button.GetComponent<Image>();
            }
            return images;
        }

        private static void EnsureEventSystemExists()
        {
            if (EventSystem.current != null) return;

            var es = new GameObject("EventSystem", typeof(EventSystem));

            // 新Input System単体のプロジェクトではStandaloneInputModuleが例外を投げるため
            // InputSystemUIInputModuleが必要。Glank.Runtime.asmdefはInput Systemを必須依存に
            // していないので、リフレクションで追加を試み、無ければレガシー版にフォールバックする
            // （GlankReporterNamePromptと同じ処理）。
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
            var moduleType = Type.GetType(
                "UnityEngine.InputSystem.UI.InputSystemUIInputModule, Unity.InputSystem");
            if (moduleType != null)
            {
                es.AddComponent(moduleType);
            }
            else
            {
                Debug.LogWarning("[Glank] InputSystemUIInputModuleが見つかりません。UIがクリックに" +
                    "反応しない場合は、シーンにInputSystemUIInputModule付きのEventSystemを配置してください。");
            }
#else
            es.AddComponent<StandaloneInputModule>();
#endif
        }

        private static Font GetDefaultFont()
        {
            var font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            return font != null ? font : Resources.GetBuiltinResource<Font>("Arial.ttf");
        }

        private static GameObject CreateUIObject(string name, Transform parent)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            return go;
        }

        private static RectTransform StretchFull(GameObject go)
        {
            var rect = go.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            return rect;
        }

        private static RectTransform SetupAnchoredRect(GameObject go, Vector2 anchor, Vector2 anchoredPos, Vector2 size)
        {
            var rect = go.GetComponent<RectTransform>();
            rect.anchorMin = anchor;
            rect.anchorMax = anchor;
            rect.pivot = anchor;
            rect.anchoredPosition = anchoredPos;
            rect.sizeDelta = size;
            return rect;
        }

        private static void StretchWithPadding(GameObject go, float horizontal, float vertical)
        {
            var rect = go.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = new Vector2(horizontal, vertical);
            rect.offsetMax = new Vector2(-horizontal, -vertical);
        }

        private static Text CreateText(Transform parent, Font font, string content,
            Vector2 anchor, Vector2 anchoredPos, Vector2 size, int fontSize, TextAnchor alignment)
        {
            var go = CreateUIObject("Text", parent);
            SetupAnchoredRect(go, anchor, anchoredPos, size);
            var text = go.AddComponent<Text>();
            text.font = font;
            text.fontSize = fontSize;
            text.alignment = alignment;
            text.color = Color.white;
            text.text = content;
            return text;
        }

        private static InputField CreateInputField(Transform parent, Font font,
            Vector2 anchor, Vector2 anchoredPos, Vector2 size, string placeholderText, bool multiline)
        {
            var go = CreateUIObject("InputField", parent);
            SetupAnchoredRect(go, anchor, anchoredPos, size);
            var image = go.AddComponent<Image>();
            image.color = Color.white;

            var textAlignment = multiline ? TextAnchor.UpperLeft : TextAnchor.MiddleLeft;

            var textGo = CreateUIObject("Text", go.transform);
            StretchWithPadding(textGo, 10f, 6f);
            var text = textGo.AddComponent<Text>();
            text.font = font;
            text.fontSize = 16;
            text.color = Color.black;
            text.alignment = textAlignment;
            text.supportRichText = false;

            var placeholderGo = CreateUIObject("Placeholder", go.transform);
            StretchWithPadding(placeholderGo, 10f, 6f);
            var placeholder = placeholderGo.AddComponent<Text>();
            placeholder.font = font;
            placeholder.fontSize = 16;
            placeholder.color = new Color(0f, 0f, 0f, 0.4f);
            placeholder.alignment = textAlignment;
            placeholder.fontStyle = FontStyle.Italic;
            placeholder.text = placeholderText;

            var inputField = go.AddComponent<InputField>();
            inputField.targetGraphic = image;
            inputField.textComponent = text;
            inputField.placeholder = placeholder;
            inputField.lineType = multiline ? InputField.LineType.MultiLineNewline : InputField.LineType.SingleLine;
            return inputField;
        }

        private static Button CreateButton(Transform parent, Font font, string label,
            Vector2 anchor, Vector2 anchoredPos, Vector2 size)
        {
            var go = CreateUIObject("Button_" + label, parent);
            SetupAnchoredRect(go, anchor, anchoredPos, size);
            var image = go.AddComponent<Image>();
            image.color = Color.white;

            var button = go.AddComponent<Button>();
            button.targetGraphic = image;

            var textGo = CreateUIObject("Text", go.transform);
            StretchWithPadding(textGo, 4f, 0f);
            var text = textGo.AddComponent<Text>();
            text.font = font;
            text.fontSize = 14;
            text.color = Color.black;
            text.alignment = TextAnchor.MiddleCenter;
            text.text = label;
            // 長いタグ名でも1行に収まるよう、枠に合わせて文字を縮める。
            text.resizeTextForBestFit = true;
            text.resizeTextMinSize = 9;
            text.resizeTextMaxSize = 14;

            return button;
        }
    }
}
