using UnityEngine;

[RequireComponent(typeof(Rigidbody2D))]
public class BallController : MonoBehaviour
{
    public float initialSpeed = 6f;
    public float speedMultiplierPerHit = 1.05f;
    public float maxSpeed = 16f;
    public float wrapBoundX = 8.4f;

    private Rigidbody2D rb;

    void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
    }

    public void ResetBall(Vector3 spawnPosition)
    {
        transform.position = spawnPosition;
        rb.linearVelocity = new Vector2(Random.Range(-2f, 2f), -initialSpeed);
    }

    void Update()
    {
        // Twist: the side walls are open - the ball wraps around instead of bouncing.
        Vector3 pos = transform.position;
        if (pos.x > wrapBoundX)
        {
            pos.x = -wrapBoundX;
            transform.position = pos;
        }
        else if (pos.x < -wrapBoundX)
        {
            pos.x = wrapBoundX;
            transform.position = pos;
        }
    }

    void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.gameObject.CompareTag("Paddle"))
        {
            float paddleCenterX = collision.transform.position.x;
            float paddleHalfWidth = collision.transform.localScale.x * 0.5f;
            float hitOffset = (transform.position.x - paddleCenterX) / paddleHalfWidth;
            hitOffset = Mathf.Clamp(hitOffset, -1f, 1f);

            float speed = Mathf.Min(rb.linearVelocity.magnitude * speedMultiplierPerHit, maxSpeed);
            Vector2 newDir = new Vector2(hitOffset, 1f).normalized;
            rb.linearVelocity = newDir * speed;
        }
    }
}
