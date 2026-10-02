using UnityEngine;

public class KillZone : MonoBehaviour
{
    // BUG: this GameObject's BoxCollider2D was left with "Is Trigger" unchecked,
    // so OnTriggerEnter2D below never fires - the collider instead behaves as a
    // solid, bouncy wall and the ball just bounces back into play. A life is never
    // lost and the ball can never actually be missed.
    void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Ball"))
        {
            if (GameManager.Instance != null) GameManager.Instance.LoseLife();
        }
    }
}
