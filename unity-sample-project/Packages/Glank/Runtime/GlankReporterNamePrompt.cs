using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Glank
{
    /// <summary>
    /// <see cref="GlankReporterIdentity"/>（報告者名）と<see cref="GlankPlayerPlatform"/>
    /// （プレイ中のプラットフォーム）を設定するための、コード不要の入力欄。
    /// これを付けるだけで、まだ報告者名を設定していない場合はゲーム起動時に自動で入力欄を出し、
    /// 一度設定すればそれ以降は出さない（PlayerPrefsで覚えているため）。
    /// <see cref="reopenHotkey"/>でいつでも開き直せる。
    ///
    /// 名前欄はビルド後の実機で日本語入力（IME）ができる必要があるため、あえて
    /// BugReportTriggerの送信通知（OnGUI/IMGUI）とは違い、<see cref="UnityEngine.UI.InputField"/>
    /// を使っている。IMGUIのGUI.TextFieldはEditor上でこそIMEが動くが、ビルドしたプレイヤーでは
    /// 全角/半角キーがOSのIMEに渡らず日本語入力ができないというUnity側の既知の制限があるため
    /// （実際にこの問題が報告された）。UnityEngine.UIのInputFieldはフォーカス時に
    /// <see cref="Input.imeCompositionMode"/>を正しく制御するため、ビルドでも日本語入力ができる。
    /// Canvas等は手動で組む必要が無いよう、必要なUI一式を初回表示時に実行時生成する
    /// （Setup Wizard・配布用プレハブから自動で配線される、というコード不要の方針は変わらない）。
    /// </summary>
    public class GlankReporterNamePrompt : MonoBehaviour
    {
        [Tooltip("ゲーム起動時、報告者名が未設定なら自動でこの入力欄を表示する")]
        [SerializeField] private bool showOnStartIfUnset = true;

        [Tooltip("いつでもこの入力欄を開き直せるホットキー")]
        [SerializeField] private KeyCode reopenHotkey = KeyCode.F9;

        [Tooltip("開いている間、Time.timeScaleを0にしてゲームを一時停止する。" +
            "物理・アニメーション等、Time.deltaTimeベースの処理が自動的に止まる" +
            "（Time.unscaledDeltaTimeを使う処理には影響しない）。")]
        [SerializeField] private bool pauseGameWhileOpen = true;

        private const int SortingOrder = 30000;

        private GameObject _canvasRoot;
        private InputField _nameField;
        private Button[] _platformButtons;
        private Image[] _platformButtonImages;
        private int _selectedPlatformIndex;
        private float _previousTimeScale = 1f;

        private static readonly Color PlatformUnselectedColor = new Color(1f, 1f, 1f, 1f);
        private static readonly Color PlatformSelectedColor = new Color(0.35f, 0.55f, 0.95f, 1f);

        private void Start()
        {
            if (showOnStartIfUnset && !GlankReporterIdentity.HasReporterName())
            {
                Show();
            }
        }

        private void Update()
        {
            if (GlankInputCompat.GetKeyDown(reopenHotkey)) Show();
        }

        /// <summary>
        /// 入力欄を開く。現在設定されている報告者名（未設定なら端末名）・プラットフォームを
        /// 初期値として表示する。
        /// </summary>
        public void Show()
        {
            EnsureUIBuilt();

            _nameField.text = GlankReporterIdentity.GetReporterName();
            int index = Array.IndexOf(GlankPlayerPlatform.Options, GlankPlayerPlatform.GetPlatform());
            SetSelectedPlatform(index >= 0 ? index : 0);

            _canvasRoot.SetActive(true);
            _nameField.Select();
            _nameField.ActivateInputField();

            if (pauseGameWhileOpen)
            {
                _previousTimeScale = Time.timeScale;
                Time.timeScale = 0f;
            }
        }

        public void Hide()
        {
            if (_canvasRoot != null) _canvasRoot.SetActive(false);
            if (pauseGameWhileOpen) Time.timeScale = _previousTimeScale;
        }

        private void Submit()
        {
            GlankReporterIdentity.SetReporterName(_nameField.text);
            GlankPlayerPlatform.SetPlatform(GlankPlayerPlatform.Options[_selectedPlatformIndex]);
            Hide();
        }

        private void SetSelectedPlatform(int index)
        {
            _selectedPlatformIndex = index;
            for (int i = 0; i < _platformButtonImages.Length; i++)
            {
                _platformButtonImages[i].color = i == index ? PlatformSelectedColor : PlatformUnselectedColor;
            }
        }

        // ==== 以下、実行時UI生成 ====
        // Setup Wizard・配布用プレハブがつけるだけで動くよう、Canvas/EventSystem/InputField一式を
        // ここでコードから組み立てる（プロジェクト側でHierarchyを手動で組む必要をなくすため）。

        private void EnsureUIBuilt()
        {
            if (_canvasRoot != null) return;
            EnsureEventSystemExists();

            var font = GetDefaultFont();

            _canvasRoot = new GameObject("GlankReporterNamePromptCanvas",
                typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            _canvasRoot.transform.SetParent(transform, false);

            var canvas = _canvasRoot.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = SortingOrder;
            // UI要素の座標が整数ピクセルからずれると、テキストのビットマップがバイリニア補間で
            // ぼやけて描画されてしまう（実際に文字がぼやける不具合が報告された）。
            // pixelPerfectを有効にして、常に整数ピクセル位置に描画を揃える。
            canvas.pixelPerfect = true;

            // ScaleWithScreenSizeは基準解像度(1920x1080等)に対する画面サイズの比率でUIを
            // 拡大縮小するため、それより小さいウィンドウ/画面ではUIが縮んで見えてしまう
            // （実際にこの問題が起きた）。以前のOnGUI実装は常に画面の生ピクセルで描画していたため、
            // それと同じ見た目になるようConstantPixelSize（常に等倍のピクセルサイズ）にする。
            var scaler = _canvasRoot.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ConstantPixelSize;
            scaler.scaleFactor = 1f;

            // 背景全体を薄暗くしつつクリックを吸収し、開いている間はゲーム本体側を操作できないようにする。
            var overlay = CreateUIObject("Overlay", _canvasRoot.transform);
            var overlayRect = StretchFull(overlay);
            var overlayImage = overlay.AddComponent<Image>();
            overlayImage.color = new Color(0f, 0f, 0f, 0.5f);

            var panel = CreateUIObject("Panel", overlay.transform);
            var panelRect = panel.GetComponent<RectTransform>();
            panelRect.anchorMin = panelRect.anchorMax = new Vector2(0.5f, 0.5f);
            panelRect.pivot = new Vector2(0.5f, 0.5f);
            panelRect.sizeDelta = new Vector2(420f, 330f);
            panelRect.anchoredPosition = Vector2.zero;
            var panelImage = panel.AddComponent<Image>();
            panelImage.color = new Color(0.15f, 0.15f, 0.17f, 0.97f);

            CreateText(panel.transform, font, "報告者名を入力してください",
                new Vector2(0.5f, 1f), new Vector2(0f, -22f), new Vector2(380f, 28f), 18);

            _nameField = CreateInputField(panel.transform, font,
                new Vector2(0.5f, 1f), new Vector2(0f, -58f), new Vector2(380f, 40f));

            CreateText(panel.transform, font, "プレイ中のプラットフォーム",
                new Vector2(0.5f, 1f), new Vector2(0f, -112f), new Vector2(380f, 24f), 14);

            BuildPlatformButtons(panel.transform, font);

            var okButton = CreateButton(panel.transform, font, "設定",
                new Vector2(0.5f, 0f), new Vector2(-98f, 24f), new Vector2(180f, 40f));
            okButton.onClick.AddListener(Submit);

            var laterButton = CreateButton(panel.transform, font, "後で",
                new Vector2(0.5f, 0f), new Vector2(98f, 24f), new Vector2(180f, 40f));
            laterButton.onClick.AddListener(Hide);

            // 「後で」を押して閉じた後、再度この入力欄をどう開けばいいか分からない、という
            // 分かりにくさが報告されたため、reopenHotkeyをここに明示しておく。
            var hint = CreateText(panel.transform, font, $"{reopenHotkey}キーでいつでも開き直せます",
                new Vector2(0.5f, 0f), new Vector2(0f, 70f), new Vector2(380f, 20f), 11);
            hint.color = new Color(1f, 1f, 1f, 0.55f);

            _canvasRoot.SetActive(false);
        }

        private void BuildPlatformButtons(Transform parent, Font font)
        {
            var options = GlankPlayerPlatform.Options;
            _platformButtons = new Button[options.Length];
            _platformButtonImages = new Image[options.Length];

            const int columns = 4;
            const float buttonWidth = 88f;
            const float buttonHeight = 32f;
            const float spacing = 6f;
            float rowWidth = columns * buttonWidth + (columns - 1) * spacing;
            float startX = -rowWidth / 2f + buttonWidth / 2f;
            float startY = -144f;

            for (int i = 0; i < options.Length; i++)
            {
                int row = i / columns;
                int col = i % columns;
                float x = startX + col * (buttonWidth + spacing);
                float y = startY - row * (buttonHeight + spacing);

                var button = CreateButton(parent, font, options[i],
                    new Vector2(0.5f, 1f), new Vector2(x, y), new Vector2(buttonWidth, buttonHeight));
                int capturedIndex = i;
                button.onClick.AddListener(() => SetSelectedPlatform(capturedIndex));

                _platformButtons[i] = button;
                _platformButtonImages[i] = button.GetComponent<Image>();
            }
        }

        private void EnsureEventSystemExists()
        {
            if (EventSystem.current != null) return;

            var es = new GameObject("EventSystem", typeof(EventSystem));

            // 新Input System単体（Active Input Handling = Input System Package (New)）のプロジェクトでは
            // レガシーInputを使うStandaloneInputModuleが例外を投げるため、その場合は
            // InputSystemUIInputModuleが必要。ただしGlank.Runtime.asmdefはInput Systemパッケージを
            // 必須依存にしていない（GlankInputCompat参照）ため、ここではリフレクションで
            // アセンブリ参照なしに追加を試み、無ければレガシー版にフォールバックする。
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

        private static Text CreateText(Transform parent, Font font, string content,
            Vector2 anchor, Vector2 anchoredPos, Vector2 size, int fontSize)
        {
            var go = CreateUIObject("Text", parent);
            SetupAnchoredRect(go, anchor, anchoredPos, size);
            var text = go.AddComponent<Text>();
            text.font = font;
            text.fontSize = fontSize;
            text.alignment = TextAnchor.MiddleCenter;
            text.color = Color.white;
            text.text = content;
            return text;
        }

        private static InputField CreateInputField(Transform parent, Font font,
            Vector2 anchor, Vector2 anchoredPos, Vector2 size)
        {
            var go = CreateUIObject("InputField", parent);
            SetupAnchoredRect(go, anchor, anchoredPos, size);
            var image = go.AddComponent<Image>();
            image.color = Color.white;

            var textGo = CreateUIObject("Text", go.transform);
            StretchWithPadding(textGo, 10f, 6f);
            var text = textGo.AddComponent<Text>();
            text.font = font;
            text.fontSize = 16;
            text.color = Color.black;
            text.alignment = TextAnchor.MiddleLeft;
            text.supportRichText = false;

            var placeholderGo = CreateUIObject("Placeholder", go.transform);
            StretchWithPadding(placeholderGo, 10f, 6f);
            var placeholder = placeholderGo.AddComponent<Text>();
            placeholder.font = font;
            placeholder.fontSize = 16;
            placeholder.color = new Color(0f, 0f, 0f, 0.4f);
            placeholder.alignment = TextAnchor.MiddleLeft;
            placeholder.fontStyle = FontStyle.Italic;
            placeholder.text = "名前を入力...";

            var inputField = go.AddComponent<InputField>();
            inputField.targetGraphic = image;
            inputField.textComponent = text;
            inputField.placeholder = placeholder;
            inputField.lineType = InputField.LineType.SingleLine;
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
            StretchFull(textGo);
            var text = textGo.AddComponent<Text>();
            text.font = font;
            text.fontSize = 14;
            text.color = Color.black;
            text.alignment = TextAnchor.MiddleCenter;
            text.text = label;

            return button;
        }

        private static void StretchWithPadding(GameObject go, float horizontal, float vertical)
        {
            var rect = go.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = new Vector2(horizontal, vertical);
            rect.offsetMax = new Vector2(-horizontal, -vertical);
        }
    }
}
