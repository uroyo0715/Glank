using UnityEngine;
using UnityEngine.UI;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public Text scoreText;
    public Text livesText;
    public Text messageText;
    public BallController ballPrefabInstance;
    public Transform ballSpawnPoint;

    private int score;
    private int lives = 3;

    void Awake()
    {
        Instance = this;
    }

    void Start()
    {
        UpdateUI();
        RespawnBall();
    }

    public void AddScore(int amount)
    {
        score += amount;
        UpdateUI();
    }

    public void LoseLife()
    {
        lives--;
        UpdateUI();

        if (lives <= 0)
        {
            if (messageText != null) messageText.text = "GAME OVER";
            return;
        }

        RespawnBall();
    }

    public void RespawnBall()
    {
        if (ballPrefabInstance == null || ballSpawnPoint == null) return;
        ballPrefabInstance.ResetBall(ballSpawnPoint.position);
    }

    void UpdateUI()
    {
        if (scoreText != null) scoreText.text = "Score: " + score;
        if (livesText != null) livesText.text = "Lives: " + lives;
    }
}
