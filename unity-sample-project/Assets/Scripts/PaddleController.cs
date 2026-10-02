using UnityEngine;
using UnityEngine.InputSystem;

public class PaddleController : MonoBehaviour
{
    public float moveSpeed = 12f;
    public float boundsHalfWidth = 8f;

    void Update()
    {
        var keyboard = Keyboard.current;
        if (keyboard == null) return;

        float moveInput = 0f;
        if (keyboard.aKey.isPressed || keyboard.leftArrowKey.isPressed) moveInput -= 1f;
        if (keyboard.dKey.isPressed || keyboard.rightArrowKey.isPressed) moveInput += 1f;

        Vector3 pos = transform.position;
        pos.x += moveInput * moveSpeed * Time.deltaTime;

        // Clamp the paddle to the play field.
        // BUG: should subtract half the paddle's own width from boundsHalfWidth on both
        // sides, but only the left side does that here - the right clamp uses the full
        // boundsHalfWidth, so the paddle can slide about half its width past the right wall.
        float halfPaddleWidth = transform.localScale.x * 0.5f;
        pos.x = Mathf.Clamp(pos.x, -boundsHalfWidth + halfPaddleWidth, boundsHalfWidth);

        transform.position = pos;
    }
}
