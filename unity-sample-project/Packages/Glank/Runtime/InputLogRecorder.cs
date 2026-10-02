using System;
using System.Collections.Generic;
using UnityEngine;

namespace Glank
{
    /// <summary>監視対象のキーと、Glank側での表示用ラベル。</summary>
    [Serializable]
    public class WatchedKey
    {
        public KeyCode key;
        public string glyph = "?";
        public string label = "";
    }

    /// <summary>
    /// 直近 bufferSeconds 分の入力を常時リングバッファに保持し、バグ報告トリガー時に
    /// docs/api-spec.md 準拠のフレームベース入力ログとして取り出せるようにする。
    /// レガシー Input クラス（Input.GetKeyDown/GetKeyUp）で検知する。
    /// </summary>
    public class InputLogRecorder : MonoBehaviour
    {
        [SerializeField] private List<WatchedKey> watchedKeys = new List<WatchedKey>();

        [Tooltip("APIに送るfps。入力ログのフレーム番号はこのfpsを基準とみなす。")]
        [SerializeField] private int fps = 60;

        [Tooltip("何秒分の入力履歴を保持するか")]
        [SerializeField] private float bufferSeconds = 10f;

        // frame/holdFramesはどちらもTime.frameCount（実際のフレームレート）ではなく
        // Time.unscaledTime（実経過時間）× fps から逆算する。理由は2つ:
        //   1. 保持期間の判定にTime.frameCountを使うと、実際のフレームレートが設定上のfpsと
        //      かけ離れている環境（Unity Editor等）では、バッファがほぼ即座に空になってしまう
        //      （実際に発生したバグ）。
        //   2. 保持期間だけ実時間ベースにして、出力するframe番号だけTime.frameCountのままだと、
        //      今度はframe/fpsで逆算される秒数が実態と食い違い、負の値や範囲外の値になる。
        // そのため、記録・出力のどちらも一貫してTime.unscaledTime基準にする。
        private class RecordedInput
        {
            public float capturedAt; // Time.unscaledTime
            public float releasedAt; // Time.unscaledTime（released==falseの間は未使用）
            public string key;
            public string label;
            public bool released;
        }

        private readonly List<RecordedInput> _buffer = new List<RecordedInput>();
        private readonly Dictionary<KeyCode, RecordedInput> _pressed = new Dictionary<KeyCode, RecordedInput>();

        private void Update()
        {
            float now = Time.unscaledTime;

            for (int i = 0; i < watchedKeys.Count; i++)
            {
                var wk = watchedKeys[i];
                if (Input.GetKeyDown(wk.key))
                {
                    var entry = new RecordedInput
                    {
                        capturedAt = now,
                        key = wk.glyph,
                        label = wk.label,
                        released = false,
                    };
                    _buffer.Add(entry);
                    _pressed[wk.key] = entry;
                }
                else if (Input.GetKeyUp(wk.key) && _pressed.TryGetValue(wk.key, out var pressedEntry))
                {
                    pressedEntry.releasedAt = now;
                    pressedEntry.released = true;
                    _pressed.Remove(wk.key);
                }
            }

            _buffer.RemoveAll(e => now - e.capturedAt > bufferSeconds);
        }

        /// <summary>
        /// 現時点までの入力ログを、クリップ先頭を0とした相対フレーム番号に変換して返す。
        /// 押しっぱなしで未リリースのキーは、現在時刻までの holdFrames を都度計算する。
        /// </summary>
        public InputLogSnapshot Capture()
        {
            float now = Time.unscaledTime;
            int durationFrames = Mathf.Max(1, Mathf.RoundToInt(bufferSeconds * fps));

            var inputs = new InputLogEntryDto[_buffer.Count];
            for (int i = 0; i < _buffer.Count; i++)
            {
                var e = _buffer[i];
                float ageSeconds = now - e.capturedAt; // 何秒前に押されたか
                int frame = Mathf.Clamp(durationFrames - Mathf.RoundToInt(ageSeconds * fps), 0, durationFrames);
                float heldSeconds = (e.released ? e.releasedAt : now) - e.capturedAt;
                int holdFrames = Mathf.Max(0, Mathf.RoundToInt(heldSeconds * fps));

                inputs[i] = new InputLogEntryDto
                {
                    frame = frame,
                    key = e.key,
                    label = e.label,
                    holdFrames = holdFrames,
                };
            }

            return new InputLogSnapshot
            {
                fps = fps,
                durationFrames = durationFrames,
                inputs = inputs,
            };
        }
    }
}
