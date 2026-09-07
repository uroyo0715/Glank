using UnityEngine;

namespace Glank
{
    /// <summary>
    /// レガシー<see cref="Input"/>クラスと新Input System（com.unity.inputsystem）の両対応が
    /// 必要な箇所（ホットキー判定）で共通して使うキー押下判定。
    ///
    /// レガシー<see cref="Input"/>クラスは、Player SettingsのActive Input Handlingが
    /// 「Input System Package (New)」単体のプロジェクトでは呼び出すだけで例外を投げるため、
    /// その場合は新Input Systemの<c>Keyboard.current</c>を使う（KeyCodeをKeyへ変換して判定）。
    /// 「Both」やレガシーのみの設定では、これまで通りレガシーInputを使う。
    ///
    /// 元々<see cref="BugReportTrigger"/>専用のprivateメソッドだったが、
    /// <see cref="GlankReporterNamePrompt"/>など他のコンポーネントからも同じ判定が必要になったため
    /// 共通処理として切り出した。
    /// </summary>
    public static class GlankInputCompat
    {
        public static bool GetKeyDown(KeyCode keyCode)
        {
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
            var keyboard = UnityEngine.InputSystem.Keyboard.current;
            if (keyboard == null) return false;
            var key = ConvertKeyCodeToKey(keyCode);
            return key != UnityEngine.InputSystem.Key.None && keyboard[key].wasPressedThisFrame;
#else
            return Input.GetKeyDown(keyCode);
#endif
        }

#if ENABLE_INPUT_SYSTEM
        /// <summary>
        /// よく使われるホットキー用のKeyCode→Key変換（網羅はしていない）。未対応のKeyCodeは
        /// Key.Noneを返し、その場合ホットキーは反応しない（Inspectorで別のキーを選んでもらう想定）。
        /// </summary>
        private static UnityEngine.InputSystem.Key ConvertKeyCodeToKey(KeyCode keyCode)
        {
            switch (keyCode)
            {
                case KeyCode.F1: return UnityEngine.InputSystem.Key.F1;
                case KeyCode.F2: return UnityEngine.InputSystem.Key.F2;
                case KeyCode.F3: return UnityEngine.InputSystem.Key.F3;
                case KeyCode.F4: return UnityEngine.InputSystem.Key.F4;
                case KeyCode.F5: return UnityEngine.InputSystem.Key.F5;
                case KeyCode.F6: return UnityEngine.InputSystem.Key.F6;
                case KeyCode.F7: return UnityEngine.InputSystem.Key.F7;
                case KeyCode.F8: return UnityEngine.InputSystem.Key.F8;
                case KeyCode.F9: return UnityEngine.InputSystem.Key.F9;
                case KeyCode.F10: return UnityEngine.InputSystem.Key.F10;
                case KeyCode.F11: return UnityEngine.InputSystem.Key.F11;
                case KeyCode.F12: return UnityEngine.InputSystem.Key.F12;
                case KeyCode.Space: return UnityEngine.InputSystem.Key.Space;
                case KeyCode.Tab: return UnityEngine.InputSystem.Key.Tab;
                case KeyCode.Escape: return UnityEngine.InputSystem.Key.Escape;
                case KeyCode.Return: return UnityEngine.InputSystem.Key.Enter;
                case KeyCode.Backspace: return UnityEngine.InputSystem.Key.Backspace;
                case KeyCode.Alpha0: return UnityEngine.InputSystem.Key.Digit0;
                case KeyCode.Alpha1: return UnityEngine.InputSystem.Key.Digit1;
                case KeyCode.Alpha2: return UnityEngine.InputSystem.Key.Digit2;
                case KeyCode.Alpha3: return UnityEngine.InputSystem.Key.Digit3;
                case KeyCode.Alpha4: return UnityEngine.InputSystem.Key.Digit4;
                case KeyCode.Alpha5: return UnityEngine.InputSystem.Key.Digit5;
                case KeyCode.Alpha6: return UnityEngine.InputSystem.Key.Digit6;
                case KeyCode.Alpha7: return UnityEngine.InputSystem.Key.Digit7;
                case KeyCode.Alpha8: return UnityEngine.InputSystem.Key.Digit8;
                case KeyCode.Alpha9: return UnityEngine.InputSystem.Key.Digit9;
                default:
                    // A-Z（KeyCode.A..KeyCode.Zは連番、InputSystem.Key.A..Zも連番なのでオフセットで変換できる）
                    if (keyCode >= KeyCode.A && keyCode <= KeyCode.Z)
                    {
                        int offset = keyCode - KeyCode.A;
                        return UnityEngine.InputSystem.Key.A + offset;
                    }
                    Debug.LogWarning($"[Glank] {keyCode}は新Input System向けの変換に未対応です。" +
                        "InspectorでF1〜F12・英数字・Space等の対応済みキーに変更してください。");
                    return UnityEngine.InputSystem.Key.None;
            }
        }
#endif
    }
}
