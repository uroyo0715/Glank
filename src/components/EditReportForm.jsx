import React, { useEffect, useState } from 'react'
import { TAG_OPTIONS, PRIORITY_OPTIONS, PLATFORM_OPTIONS } from '../data/mockBugs.js'
import ComboField from './ComboField.jsx'
import TagMultiField from './TagMultiField.jsx'

function fieldsFromBug(bug) {
  return {
    title: bug.title,
    tags: bug.tags ?? [],
    desc: bug.desc,
    who: bug.who,
    build: bug.build,
    platform: bug.platform,
    priority: bug.priority || 'medium',
  }
}

export default function EditReportForm({
  bug,
  buildOptions,
  existingTags,
  hiddenFieldOptions,
  customFieldOptions,
  onFetchMembers,
  onUpdate,
  onClose,
}) {
  const [fields, setFields] = useState(() => fieldsFromBug(bug))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [whoOptions, setWhoOptions] = useState([])

  // 「入力項目の管理」で明示的に登録したプリセットに加えて、このプロジェクトで実際に
  // これまで使われたことのあるタグ（reportFacets.tags）もリストから選べるようにする
  // （そうしないと、毎回同じタグを自由入力欄に手打ちし直すことになって不便なため）。
  const tagOptions = [
    ...new Set([
      ...TAG_OPTIONS.map((t) => t.key),
      ...(customFieldOptions?.tag ?? []),
      ...(existingTags ?? []),
    ]),
  ].map((v) => ({ value: v, label: TAG_OPTIONS.find((t) => t.key === v)?.label ?? v }))
  const platformOptions = [...PLATFORM_OPTIONS, ...(customFieldOptions?.platform ?? [])]

  useEffect(() => {
    let cancelled = false
    onFetchMembers(bug.projectId)
      .then((members) => {
        if (cancelled) return
        const names = [...new Set(members.map((m) => m.displayName).filter(Boolean))].sort()
        setWhoOptions(names)
      })
      .catch(() => {
        if (!cancelled) setWhoOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [bug.projectId, onFetchMembers])

  function setField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  // 編集時は「詳細」を必須にしない。クイック送信（ホットキー即送信）の報告は
  // 詳細が空のまま作られるのが普通で、内容を追記しなくても他の項目（対応状況等）だけ
  // 直したいことが多いため。
  const requiredFilled =
    fields.title.trim() &&
    fields.tags.length > 0 &&
    fields.who.trim() &&
    fields.build.trim() &&
    fields.platform.trim()

  function handleSubmit(e) {
    e.preventDefault()
    if (!requiredFilled) return
    setSubmitting(true)
    setError(null)
    onUpdate(bug.id, fields)
      .then(() => onClose())
      .catch((err) => setError(err.message ?? String(err)))
      .finally(() => setSubmitting(false))
  }

  return (
    <form className="new-report-form" onSubmit={handleSubmit}>
      <div className="new-report-hint">
        報告後でもタイトル・ビルドバージョンなどを直せます（録画・入力ログは編集できません）。
      </div>

      <div className="new-report-grid">
        <label className="new-report-field new-report-field-wide">
          <span>タイトル</span>
          <input
            type="text"
            value={fields.title}
            onChange={(e) => setField('title', e.target.value)}
            autoFocus
          />
        </label>

        <div className="new-report-field new-report-field-wide">
          <span>タグ（複数選択可）</span>
          <TagMultiField
            value={fields.tags}
            onChange={(v) => setField('tags', v)}
            options={tagOptions}
            hiddenValues={hiddenFieldOptions?.tag}
            manualPlaceholder="例: サウンド不具合"
          />
        </div>

        <label className="new-report-field">
          <span>優先度</span>
          <select value={fields.priority} onChange={(e) => setField('priority', e.target.value)}>
            {PRIORITY_OPTIONS.filter(
              (p) => p.key === fields.priority || !hiddenFieldOptions?.priority?.includes(p.key)
            ).map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="new-report-field new-report-field-wide">
          <span>詳細</span>
          <textarea
            value={fields.desc}
            onChange={(e) => setField('desc', e.target.value)}
            rows={3}
          />
        </label>

        <label className="new-report-field">
          <span>報告者</span>
          <ComboField
            value={fields.who}
            onChange={(v) => setField('who', v)}
            options={whoOptions}
            placeholder="メンバーから選択"
            manualPlaceholder="報告者名を入力"
          />
        </label>

        <label className="new-report-field">
          <span>ビルド</span>
          <ComboField
            value={fields.build}
            onChange={(v) => setField('build', v)}
            options={buildOptions ?? []}
            placeholder="既存のビルドから選択"
            manualPlaceholder="例: 0.14.2-dev"
          />
        </label>

        <label className="new-report-field">
          <span>プラットフォーム</span>
          <ComboField
            value={fields.platform}
            onChange={(v) => setField('platform', v)}
            options={platformOptions}
            hiddenValues={hiddenFieldOptions?.platform}
            placeholder="選択してください"
            manualPlaceholder="例: PC (Steam)"
          />
        </label>
      </div>

      {error && <div className="project-form-error">{error}</div>}

      <div className="new-report-actions">
        <button type="submit" disabled={submitting || !requiredFilled}>
          {submitting ? '保存中...' : '保存'}
        </button>
        <button type="button" onClick={onClose} disabled={submitting}>
          キャンセル
        </button>
      </div>
    </form>
  )
}
