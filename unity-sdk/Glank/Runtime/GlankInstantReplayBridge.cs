#if GLANK_INSTANT_REPLAY
using UnityEngine;

namespace Glank
{
    /// <summary>
    /// <see cref="InstantReplayVideoRecorder"/> を使うプロジェクト向けの橋渡し役。
    /// <see cref="BugReportTrigger.GetLatestClipPathAsync"/> はデリゲート型のためInspectorから
    /// 直接ドラッグ&amp;ドロップで割り当てられない。このコンポーネントを同じGameObjectに追加し、
    /// <see cref="recorder"/>にInstantReplayVideoRecorderを割り当てるだけで、起動時に自動で
    /// 配線される（コードを書く必要はない。<see cref="GlankNewInputSystemBridge"/>と同じ仕組み）。
    /// </summary>
    [RequireComponent(typeof(BugReportTrigger))]
    public class GlankInstantReplayBridge : MonoBehaviour
    {
        [SerializeField] private InstantReplayVideoRecorder recorder;

        private void Awake()
        {
            if (recorder == null)
            {
                Debug.LogError("[Glank] GlankInstantReplayBridgeにInstantReplayVideoRecorderが設定されていません。");
                return;
            }
            GetComponent<BugReportTrigger>().GetLatestClipPathAsync = recorder.GetLatestClipPathAsync;
        }
    }
}
#endif
