import { app } from './app.js'
import { startBackupSchedule } from './backup.js'
import { startVideoRetentionSchedule } from './videoRetention.js'

const PORT = process.env.PORT || 8787

startBackupSchedule()
startVideoRetentionSchedule()

app.listen(PORT, () => {
  console.log(`Glank API server listening on http://localhost:${PORT}/api/v1`)
})
