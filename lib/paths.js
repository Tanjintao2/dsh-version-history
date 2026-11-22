/**
 * dsh-version-history · 默认路径
 *
 * 插件本身不含任何脚本与数据，全部靠外部约定：
 *   <root>/reports/*.json        由外部脚本生成的快照（数据、磁盘健康、SMART、仓库清单、GitHub 绑定）
 *   <root>/reports/history.html  离线版本历史页
 *   <root>/scripts/*.ps1         visualize / disk-health / disk-health-admin / smart-launch / dpapi
 *
 * <root> 默认是 `~/.dsh-version-history`，可用环境变量改成别处：
 *   DSH_VH_ROOT        根目录（下面自动派生 reports / scripts / repos）
 *   DSH_VH_REPORTS     只改 reports 目录
 *   DSH_VH_SCRIPTS     只改脚本目录
 *   DSH_VH_REPOS_ROOT  局域网共享服务的裸仓目录（默认 <root>/repos）
 *   DSH_VH_GIT         git 可执行文件（默认 'git'，走 PATH）
 *   DSH_VH_LAN_PORT    局域网 Smart HTTP 端口（默认 8788）
 *   DSH_VH_REPOS       预置的仓库清单（分号或逗号分隔），只在 repos.json 还不存在时生效
 *
 * 单项路径也可以在插件的 config 里逐个覆盖（见 README 的配置表），
 * config 优先级最高，其次环境变量，最后是这里的默认值。
 */
import { homedir } from 'node:os'
import { join } from 'node:path'

const env = process.env

const root = env.DSH_VH_ROOT || join(homedir(), '.dsh-version-history')
const reports = env.DSH_VH_REPORTS || join(root, 'reports')
const scripts = env.DSH_VH_SCRIPTS || join(root, 'scripts')

export const ROOT = root
export const REPORTS_DIR = reports
export const SCRIPTS_DIR = scripts

export const PATH_DEFAULTS = {
  dataPath: join(reports, 'data.json'),
  reportPath: join(reports, 'history.html'),
  scriptPath: join(scripts, 'visualize.ps1'),
  reposPath: join(reports, 'repos.json'),
  healthPath: join(reports, 'health.json'),
  healthScript: join(scripts, 'disk-health.ps1'),
  smartPath: join(reports, 'smart.json'),
  smartScript: join(scripts, 'disk-health-admin.ps1'),
  smartLauncher: join(scripts, 'smart-launch.ps1'),
  smartStatePath: join(reports, 'smart.state.json'),
  smartLogPath: join(reports, 'smart.log'),
  githubPath: join(reports, 'github.json'),
  dpapiScript: join(scripts, 'dpapi.ps1'),
  reposRoot: env.DSH_VH_REPOS_ROOT || join(root, 'repos'),
  gitExe: env.DSH_VH_GIT || 'git',
  lanPort: Number(env.DSH_VH_LAN_PORT || 8788),
}
