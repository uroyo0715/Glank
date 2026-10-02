using UnityEngine;

public class Block : MonoBehaviour
{
    public int hitPoints = 1;
    public int scoreValue = 10;
    public Color damagedColor = new Color(1f, 0.5f, 0.2f);

    void OnCollisionEnter2D(Collision2D collision)
    {
        if (!collision.gameObject.CompareTag("Ball")) return;

        hitPoints--;
        if (hitPoints <= 0)
        {
            if (GameManager.Instance != null) GameManager.Instance.AddScore(scoreValue);
            Destroy(gameObject);
        }
        else
        {
            var renderer = GetComponent<MeshRenderer>();
            if (renderer != null) renderer.material.color = damagedColor;
        }
    }
}
