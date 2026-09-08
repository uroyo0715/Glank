## Glank APIサーバーへの接続設定。docs/api-spec.md の バックエンドURL / X-Glank-Key に対応する。
## Godotエディタで新規リソースとして作成し(FileSystemを右クリック > New Resource > GlankConfig)、
## .tres として保存して各ノードのInspectorに割り当てる。
class_name GlankConfig
extends Resource

## 末尾に /reports は付けない。既定値は本番バックエンドのURLなので、自前で別環境
## （ステージング・自前デプロイ等）を使う場合以外は変更不要
@export var base_url: String = "https://glank.onrender.com/api/v1"

## POST /reports に付与するX-Glank-Keyヘッダー。プロジェクトごとに発行される値で、
## Webアプリのプロジェクトカードの「APIキーを表示」から確認できる
@export var api_key: String = ""

## 報告先のGlankプロジェクトID。Web側のプロジェクト一覧画面でカードに表示されている番号
@export var project_id: int = 0

## クラッシュ・フリーズの自動検知/自動報告を有効にする。既定false。
## 配布ビルドに含める場合、意図せず大量の自動報告が飛ぶのを防ぐため既定で無効にしている。
@export var auto_detection_enabled: bool = false
