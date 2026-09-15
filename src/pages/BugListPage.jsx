import React, { useEffect, useRef, useState } from 'react'
import { STATUS_COLUMNS, PRIORITY_OPTIONS } from '../data/mockBugs.js'
import FilterBar from '../components/FilterBar.jsx'
import MembersPanel from '../components/MembersPanel.jsx'
import NewReportForm from '../components/NewReportForm.jsx'
import StorageSettingsPanel from '../components/StorageSettingsPanel.jsx'
import FieldOptionsPanel from '../components/FieldOptionsPanel.jsx'
import NotificationSettingsPanel from '../components/NotificationSettingsPanel.jsx'
import SegmentedToggle from '../components/SegmentedToggle.jsx'
import { formatCreatedAt } from '../utils/formatDate.js'
import { backendUrl } from '../api/index.js'

function statusLabel(key) {
  return STATUS_COLUMNS.find((s) => s.key === key)?.label ?? key
}

function priorityLabel(key) {
  return PRIORITY_OPTIONS.find((p) => p.key === key)?.label ?? key
}

// 「メンバー」「ストレージ設定」「検索項目の管理」「SDK接続情報」をまとめる管理メニュー。
// ヘッダーに個別ボタンをそのまま並べると項目数が多く折り返して見苦しくなるため、1つの
// ドロップダウンに集約する（開閉ロジックはNavMenu.jsxの外側クリックで閉じる実装と同じ）。
// SDK接続情報（バックエンドURL・Project ID・API Key）はSetup Wizard/プレハブに入力する3項目で、
// プロジェクトを開いてSDKをセットアップする流れの中で見たいものなので、プロジェクト一覧の
// カードではなくこちらに置く。
function ManageMenu({
  showMembers,
  setShowMembers,
  showStorage,
  setShowStorage,
  showFieldOptions,
  setShowFieldOptions,
  showNotifications,
  setShowNotifications,
  storageBlocked,
  projectId,
  onFetchApiKey,
  onRegenerateApiKey,
  projectPlan,
  onExportReports,
  exportFilters,
}) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(null) // null | 'csv' | 'pdf'
  const [exportError, setExportError] = useState(null)
  const [infoRevealed, setInfoRevealed] = useState(false)
  // Project ID・APIキー・バックエンドURLはそれぞれ個別に隠せる（1項目だけ見せて残りは隠す、
  // といった使い方ができるように）。
  const [fieldVisible, setFieldVisible] = useState({ projectId: false, apiKey: false, backendUrl: false })
  const [apiKeyState, setApiKeyState] = useState('idle') // 'idle' | 'loading' | 'shown' | 'error'
  const [apiKey, setApiKey] = useState(null)
  const [apiKeyError, setApiKeyError] = useState(null)
  const [regenerating, setRegenerating] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const rootRef = useRef(null)

  function toggleFieldVisible(field) {
    setFieldVisible((v) => ({ ...v, [field]: !v[field] }))
  }

  // メニューを閉じるたびにSDK接続情報（Project ID・APIキー・バックエンドURL）の表示状態も
  // リセットする。開いたままにしておくと、画面を見られたりスクリーンショット/共有された際に
  // APIキー等がずっと見える状態になってしまうため（実際にこれが不安点として指摘された）、
  // 毎回明示的に「表示」し直さないと見えないようにする。
  function hideInfo() {
    setInfoRevealed(false)
    setFieldVisible({ projectId: false, apiKey: false, backendUrl: false })
    setApiKeyState('idle')
    setApiKey(null)
    setApiKeyError(null)
  }

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
        hideInfo()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  function select(toggleFn) {
    setOpen(false)
    hideInfo()
    toggleFn((v) => !v)
  }

  function revealInfo() {
    setInfoRevealed(true)
    if (apiKeyState !== 'idle') return
    setApiKeyState('loading')
    onFetchApiKey(projectId)
      .then((result) => {
        setApiKey(result.apiKey)
        setApiKeyState('shown')
      })
      .catch((err) => {
        setApiKeyError(err.message ?? String(err))
        setApiKeyState('error')
      })
  }

  function copyValue(field, value) {
    return () => {
      navigator.clipboard
        ?.writeText(value)
        .then(() => {
          setCopiedField(field)
          setTimeout(() => setCopiedField((f) => (f === field ? null : f)), 1500)
        })
        .catch(() => {})
    }
  }

  function regenerate() {
    if (
      !window.confirm(
        'APIキーを再発行します。古いキーを使っているSDKはこれ以降送信できなくなります。よろしいですか？'
      )
    ) {
      return
    }
    setRegenerating(true)
    setApiKeyError(null)
    onRegenerateApiKey(projectId)
      .then((result) => setApiKey(result.apiKey))
      .catch((err) => setApiKeyError(err.message ?? String(err)))
      .finally(() => setRegenerating(false))
  }

  function handleExport(format) {
    setExporting(format)
    setExportError(null)
    onExportReports(projectId, exportFilters, format)
      .then(({ blob, filename }) => {
        // Blobをファイルとして保存させる。ダウンロード後すぐにURLを破棄してよい
        // （<a>要素はDOMに追加しなくてもclick()できる）。
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        URL.revokeObjectURL(url)
      })
      .catch((err) => setExportError(err.message ?? String(err)))
      .finally(() => setExporting(null))
  }

  const anyPanelOpen = showMembers || showStorage || showFieldOptions || showNotifications

  return (
    <div className="manage-menu" ref={rootRef}>
      <button
        type="button"
        className={`panel-toggle manage-menu-toggle ${anyPanelOpen ? 'active' : ''}`}
        onClick={() => {
          setOpen((v) => {
            if (v) hideInfo()
            return !v
          })
        }}
        aria-expanded={open}
      >
        管理
        {storageBlocked && <span className="manage-menu-dot" aria-label="要対応" />}
        <span className="manage-menu-caret">▾</span>
      </button>
      {open && (
        <div className="manage-menu-dropdown">
          <button
            type="button"
            className={`manage-menu-item ${showMembers ? 'active' : ''}`}
            onClick={() => select(setShowMembers)}
          >
            メンバー
          </button>
          <button
            type="button"
            className={`manage-menu-item ${showStorage ? 'active' : ''}`}
            onClick={() => select(setShowStorage)}
          >
            ストレージ設定
            {storageBlocked && <span className="manage-menu-dot" aria-label="要対応" />}
          </button>
          <button
            type="button"
            className={`manage-menu-item ${showFieldOptions ? 'active' : ''}`}
            onClick={() => select(setShowFieldOptions)}
          >
            検索項目の管理
          </button>
          <button
            type="button"
            className={`manage-menu-item ${showNotifications ? 'active' : ''}`}
            onClick={() => select(setShowNotifications)}
          >
            通知設定
            {projectPlan && !projectPlan.proFeatures && (
              <span className="manage-menu-item-badge">Pro</span>
            )}
          </button>
          <div className="manage-menu-item manage-menu-export">
            <span>エクスポート</span>
            {projectPlan && !projectPlan.proFeatures ? (
              <span className="manage-menu-item-badge">Pro</span>
            ) : (
              <span className="manage-menu-export-buttons">
                <button type="button" className="help-link" onClick={() => handleExport('csv')} disabled={exporting != null}>
                  {exporting === 'csv' ? '出力中...' : 'CSV'}
                </button>
                <button type="button" className="help-link" onClick={() => handleExport('pdf')} disabled={exporting != null}>
                  {exporting === 'pdf' ? '出力中...' : 'PDF'}
                </button>
              </span>
            )}
          </div>
          {exportError && <div className="project-form-error manage-menu-export-error">{exportError}</div>}
          {!infoRevealed ? (
            <button type="button" className="manage-menu-item" onClick={revealInfo}>
              SDK接続情報を表示
            </button>
          ) : (
            <div className="manage-menu-connection-info">
              <div className="manage-menu-connection-info-head">
                <span>SDK接続情報</span>
                <button type="button" className="help-link" onClick={hideInfo}>
                  隠す
                </button>
              </div>
              <div className="manage-menu-connection-row">
                <div className="manage-menu-connection-label">バックエンドURL</div>
                {fieldVisible.backendUrl ? (
                  <>
                    <div className="manage-menu-connection-value mono">{backendUrl()}</div>
                    <button type="button" className="help-link" onClick={copyValue('backendUrl', backendUrl())}>
                      {copiedField === 'backendUrl' ? 'コピーしました' : 'コピー'}
                    </button>
                  </>
                ) : (
                  <div className="manage-menu-connection-value mono">••••••••</div>
                )}
                <button type="button" className="help-link" onClick={() => toggleFieldVisible('backendUrl')}>
                  {fieldVisible.backendUrl ? '隠す' : '表示'}
                </button>
              </div>
              <div className="manage-menu-connection-row">
                <div className="manage-menu-connection-label">API Key</div>
                {apiKeyState === 'loading' && <div className="manage-menu-connection-value">読み込み中...</div>}
                {apiKeyState === 'error' && <div className="project-form-error">{apiKeyError}</div>}
                {apiKeyState === 'shown' && (
                  <>
                    {fieldVisible.apiKey ? (
                      <>
                        <div className="manage-menu-connection-value mono">{apiKey}</div>
                        <button type="button" className="help-link" onClick={copyValue('apiKey', apiKey)}>
                          {copiedField === 'apiKey' ? 'コピーしました' : 'コピー'}
                        </button>
                      </>
                    ) : (
                      <div className="manage-menu-connection-value mono">••••••••</div>
                    )}
                    <button type="button" className="help-link" onClick={() => toggleFieldVisible('apiKey')}>
                      {fieldVisible.apiKey ? '隠す' : '表示'}
                    </button>
                  </>
                )}
              </div>
              <div className="manage-menu-apikey-actions">
                <button
                  type="button"
                  className="help-link"
                  onClick={regenerate}
                  disabled={regenerating || apiKeyState !== 'shown'}
                >
                  {regenerating ? 'APIキーを再発行中...' : 'APIキーを再発行'}
                </button>
              </div>
              <div className="manage-menu-connection-row">
                <div className="manage-menu-connection-label">Project ID</div>
                {fieldVisible.projectId ? (
                  <>
                    <div className="manage-menu-connection-value mono">{projectId}</div>
                    <button
                      type="button"
                      className="help-link"
                      onClick={copyValue('projectId', String(projectId))}
                    >
                      {copiedField === 'projectId' ? 'コピーしました' : 'コピー'}
                    </button>
                  </>
                ) : (
                  <div className="manage-menu-connection-value mono">••••••••</div>
                )}
                <button type="button" className="help-link" onClick={() => toggleFieldVisible('projectId')}>
                  {fieldVisible.projectId ? '隠す' : '表示'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function BugListPage({
  bugs,
  bugsLoading,
  bugsError,
  onOpen,
  projectId,
  projectName,
  onFetchMembers,
  onAddMembers,
  onRemoveMember,
  onCreateReport,
  defaultReporterName,
  storageStatus,
  onFetchStorageStatus,
  onUpdateStorage,
  hiddenFieldOptions,
  onUpdateFieldOptions,
  customFieldOptions,
  onAddCustomOption,
  onRemoveCustomOption,
  onFetchApiKey,
  onRegenerateApiKey,
  onFetchPlan,
  onFetchNotificationStatus,
  onUpdateNotifications,
  onExportReports,
  query,
  setQuery,
  statusFilter,
  toggleStatus,
  tagFilter,
  toggleTag,
  priorityFilter,
  togglePriority,
  buildFilter,
  setBuildFilter,
  whoFilter,
  setWhoFilter,
  assigneeFilter,
  setAssigneeFilter,
  reportFacets,
}) {
  const [view, setView] = useState('table') // 'table' | 'kanban'
  const [showMembers, setShowMembers] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [projectPlan, setProjectPlan] = useState(null)

  // 管理メニューの「通知設定」「エクスポート」をPro限定でロック表示するための現在のプラン。
  useEffect(() => {
    if (!onFetchPlan) return
    let cancelled = false
    onFetchPlan(projectId)
      .then((result) => {
        if (!cancelled) setProjectPlan(result)
      })
      .catch(() => {}) // 表示できなくても致命的ではないので静かに諦める
    return () => {
      cancelled = true
    }
  }, [projectId, onFetchPlan])
  const [showNewReport, setShowNewReport] = useState(false)
  const [showStorage, setShowStorage] = useState(false)
  const [showFieldOptions, setShowFieldOptions] = useState(false)

  // 絞り込みは App.jsx が fetchReports() 呼び出し時にサーバー側（クエリパラメータ）で行う。
  // ここでは取得済みの bugs をそのまま表示する。
  const filtered = bugs
  // ステータスの絞り込みで外されたタブはボード表示でも列ごと非表示にする（カードだけでなく）。
  const visibleStatusColumns = STATUS_COLUMNS.filter((col) => statusFilter.includes(col.key))

  // エクスポートに渡すフィルター。App.jsxがGET /reportsに渡す組み立て方と揃えてある
  // （サーバー側のクエリパラメータは単一値のみ対応のため、複数選択時は絞り込まず全件を出す）。
  const exportFilters = { q: query.trim() || undefined }
  if (statusFilter.length === 1) exportFilters.status = statusFilter[0]
  if (tagFilter.length === 1) exportFilters.tag = tagFilter[0]
  if (priorityFilter.length === 1) exportFilters.priority = priorityFilter[0]
  if (buildFilter) exportFilters.build = buildFilter
  if (whoFilter) exportFilters.who = whoFilter
  if (assigneeFilter) exportFilters.assignee = assigneeFilter

  // self_hostedでTurso未設定の間は、報告機能そのものが使えない（要件）。
  const storageBlocked =
    storageStatus != null && storageStatus.storageMode === 'self_hosted' && !storageStatus.tursoConfigured

  return (
    <main className="list-page">
      <div className="list-header">
        <div className="list-header-row">
          <h1>プロジェクト: {projectName}</h1>
          <div className="list-header-actions">
            <button
              type="button"
              className={`panel-toggle ${showNewReport ? 'active' : ''}`}
              onClick={() => setShowNewReport((v) => !v)}
            >
              + 新規報告
            </button>
            <ManageMenu
              showMembers={showMembers}
              setShowMembers={setShowMembers}
              showStorage={showStorage}
              setShowStorage={setShowStorage}
              showFieldOptions={showFieldOptions}
              setShowFieldOptions={setShowFieldOptions}
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              storageBlocked={storageBlocked}
              projectId={projectId}
              onFetchApiKey={onFetchApiKey}
              onRegenerateApiKey={onRegenerateApiKey}
              projectPlan={projectPlan}
              onExportReports={onExportReports}
              exportFilters={exportFilters}
            />
            <SegmentedToggle
              value={view}
              onChange={setView}
              options={[
                { value: 'table', label: 'テーブル' },
                { value: 'kanban', label: 'ボード' },
              ]}
            />
          </div>
        </div>
      </div>

      {showStorage && (
        <StorageSettingsPanel
          projectId={projectId}
          onFetchStatus={onFetchStorageStatus}
          onUpdateStorage={onUpdateStorage}
        />
      )}

      {showFieldOptions && (
        <FieldOptionsPanel
          hiddenFieldOptions={hiddenFieldOptions}
          onUpdateFieldOptions={onUpdateFieldOptions}
          customFieldOptions={customFieldOptions}
          onAddCustomOption={onAddCustomOption}
          onRemoveCustomOption={onRemoveCustomOption}
        />
      )}

      {showNotifications && (
        <NotificationSettingsPanel
          projectId={projectId}
          onFetchStatus={onFetchNotificationStatus}
          onUpdateNotifications={onUpdateNotifications}
        />
      )}

      {storageBlocked ? (
        <div className="storage-blocking-panel">
          <p>
            このプロジェクトはまだデータベース（Turso）が設定されていないため、報告の閲覧・作成ができません。
            「ストレージ設定」から接続情報を入力してください。
          </p>
          <button className="help-link" onClick={() => setShowStorage(true)}>
            ストレージ設定を開く
          </button>
        </div>
      ) : (
        <>
          {showNewReport && (
            <NewReportForm
              projectId={projectId}
              defaultWho={defaultReporterName}
              buildOptions={reportFacets.builds}
              existingTags={reportFacets.tags}
              hiddenFieldOptions={hiddenFieldOptions}
              customFieldOptions={customFieldOptions}
              onFetchMembers={onFetchMembers}
              onCreate={onCreateReport}
              onClose={() => setShowNewReport(false)}
            />
          )}

          {showMembers && (
            <MembersPanel
              projectId={projectId}
              onFetchMembers={onFetchMembers}
              onAddMembers={onAddMembers}
              onRemoveMember={onRemoveMember}
              onFetchPlan={onFetchPlan}
            />
          )}

          <FilterBar
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            toggleStatus={toggleStatus}
            tagFilter={tagFilter}
            toggleTag={toggleTag}
            priorityFilter={priorityFilter}
            togglePriority={togglePriority}
            buildFilter={buildFilter}
            setBuildFilter={setBuildFilter}
            whoFilter={whoFilter}
            setWhoFilter={setWhoFilter}
            assigneeFilter={assigneeFilter}
            setAssigneeFilter={setAssigneeFilter}
            reportFacets={reportFacets}
            hiddenFieldOptions={hiddenFieldOptions}
            customFieldOptions={customFieldOptions}
            resultCount={filtered.length}
          />

          {bugsLoading && <div className="list-inline-status">更新中...</div>}
          {!bugsLoading && bugsError && (
            <div className="list-inline-status list-inline-status-error">
              最新の一覧を取得できませんでした: {bugsError}
            </div>
          )}

          {view === 'table' ? (
            <div className="bug-table">
              <div className="bug-table-head">
                <div className="col-title">タイトル</div>
                <div className="col-tag">タグ</div>
                <div className="col-status">対応状況</div>
                <div className="col-who">報告者</div>
                <div className="col-build">ビルド</div>
                <div className="col-priority">優先度</div>
                <div className="col-created">報告日時</div>
              </div>
              <div className="bug-table-body">
                {filtered.length === 0 && (
                  <div className="empty-hint table-empty">条件に一致する報告はありません</div>
                )}
                {filtered.map((b) => (
                  <div className="bug-row" key={b.id} onClick={() => onOpen(b.id)}>
                    <div className="col-title">{b.title}</div>
                    <div className="col-tag">
                      {b.tags.map((t, i) => (
                        <span className={`tag ${t}`} key={t}>
                          {b.tagLabels[i]}
                        </span>
                      ))}
                    </div>
                    <div className="col-status">
                      <span className={`status-badge ${b.status}`}>{statusLabel(b.status)}</span>
                    </div>
                    <div className="col-who">{b.who}</div>
                    <div className="col-build mono">{b.build}</div>
                    <div className="col-priority">{priorityLabel(b.priority)}</div>
                    <div className="col-created">{b.createdAt ? formatCreatedAt(b.createdAt) : '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : visibleStatusColumns.length === 0 ? (
            <div className="empty-hint table-empty">対応状況の絞り込みがすべて解除されています</div>
          ) : (
            <div
              className="kanban"
              style={{ gridTemplateColumns: `repeat(${visibleStatusColumns.length}, minmax(0, 1fr))` }}
            >
              {visibleStatusColumns.map((col) => {
                const items = filtered.filter((b) => b.status === col.key)
                return (
                  <div className="kanban-col" key={col.key}>
                    <div className="kanban-col-head">
                      <span>{col.label}</span>
                      <span className="count">{items.length}</span>
                    </div>
                    <div className="kanban-col-body">
                      {items.length === 0 && <div className="empty-hint">報告なし</div>}
                      {items.map((b) => (
                        <div className="bug-card" key={b.id} onClick={() => onOpen(b.id)}>
                          <div className="title">{b.title}</div>
                          <div className="meta">
                            {b.tags.map((t, i) => (
                              <span className={`tag ${t}`} key={t}>
                                {b.tagLabels[i]}
                              </span>
                            ))}
                            <span className="who">{b.who}</span>
                            {b.createdAt && (
                              <span className="created-at">{formatCreatedAt(b.createdAt)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </main>
  )
}
