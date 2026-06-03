// ============================================================
// OctoMobile · i18n system (lightweight, no external deps)
// ============================================================

import { useApp } from '../state/store';

type Lang = 'en' | 'es';

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.repos': 'Repos',
    'nav.inbox': 'Inbox',
    'nav.search': 'Search',
    'nav.me': 'Me',

    // Common
    'common.loading': 'Loading…',
    'common.refresh': 'Refresh',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.done': 'Done',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.search': 'Search',
    'common.noResults': 'No results',
    'common.loadMore': 'Load more…',
    'common.noMore': 'No more items',
    'common.updated': 'Updated',
    'common.copied': 'Copied!',

    // Auth
    'auth.welcome': 'Welcome to OctoMobile',
    'auth.subtitle': 'Your GitHub companion on Android',
    'auth.loginPAT': 'Login with PAT',
    'auth.loginOAuth': 'Login with GitHub',
    'auth.enterToken': 'Enter your token…',
    'auth.invalidToken': 'Invalid or expired token',
    'auth.logout': 'Log out',
    'auth.logoutConfirm': 'Log out?',

    // Home
    'home.greeting': 'Hello',
    'home.activity': 'Activity summary',
    'home.quickAccess': 'Quick access',
    'home.notifications': 'Notifications',
    'home.recentRepos': 'Recent repos',
    'home.viewAll': 'View all →',
    'home.activityFeed': 'Activity',

    // Repo
    'repo.files': 'Files',
    'repo.branches': 'Branches',
    'repo.history': 'History',
    'repo.compare': 'Compare',
    'repo.star': 'Star',
    'repo.unstar': 'Unstar',
    'repo.fork': 'Fork',
    'repo.open': 'Open in browser',
    'repo.searchInRepo': 'Search in repo',
    'repo.settings': 'Settings',
    'repo.languages': 'Languages',
    'repo.ci': 'CI',
    'repo.lastCommit': 'Last commit',
    'repo.private': 'private',
    'repo.default': 'default',

    // Commits
    'commits.title': 'History',
    'commits.noMore': 'No more commits',

    // Issues
    'issues.title': 'Issues',
    'issues.open': 'open',
    'issues.closed': 'closed',
    'issues.all': 'all',
    'issues.new': 'New issue',
    'issues.noItems': 'No issues',

    // Pull Requests
    'prs.title': 'Pull Requests',
    'prs.new': 'New PR',
    'prs.merge': 'Merge',
    'prs.squash': 'Squash & merge',
    'prs.rebase': 'Rebase & merge',
    'prs.approve': 'Approve',
    'prs.requestChanges': 'Request changes',
    'prs.comment': 'Comment',

    // Files
    'files.title': 'Files',
    'files.blame': 'Blame',
    'files.wrap': 'Toggle wrap',
    'files.binary': 'Binary file',
    'files.download': 'Download',
    'files.search': 'Search…',

    // Notifications
    'notifs.title': 'Notifications',
    'notifs.unread': 'Unread',
    'notifs.all': 'All',
    'notifs.markRead': 'Mark all as read',
    'notifs.noItems': 'No notifications',
    'notifs.upToDate': "You're up to date",

    // Settings
    'settings.title': 'Settings / Account',
    'settings.appearance': 'Appearance',
    'settings.theme': 'Theme',
    'settings.fontSize': 'Font size',
    'settings.notifications': 'Notifications',
    'settings.polling': 'Notification polling',
    'settings.interval': 'Interval (min)',
    'settings.vibration': 'Vibration',
    'settings.rateLimit': 'Rate limit',
    'settings.limit': 'Limit',
    'settings.remaining': 'Remaining',
    'settings.reset': 'Reset',
    'settings.advanced': 'Advanced',
    'settings.session': 'Session',
    'settings.about': 'About OctoMobile',
    'settings.pinLock': 'PIN Lock',
    'settings.pinLockDesc': 'Require PIN to open the app',
    'settings.favorites': 'Favorite Repos',

    // Reset
    'reset.title': 'Git Reset',
    'reset.branch': 'Branch to reset',
    'reset.selectBranch': 'Select a branch…',
    'reset.currentBranch': 'Current branch',
    'reset.moveToCommit': 'Will move to commit',
    'reset.destructive': 'Destructive operation',
    'reset.destructiveDesc': 'Commits after this point will be lost from the selected branch. Other collaborators may be affected.',
    'reset.doReset': 'Do Git Reset',
    'reset.confirmMsg': 'RESET',
    'reset.confirmText': 'to commit',
    'reset.branchWillMove': 'This will move the branch pointer to the selected commit. This is equivalent to git reset --hard followed by git push --force.',

    // Compare
    'compare.title': 'Compare',
    'compare.base': 'Base',
    'compare.head': 'Head',
    'compare.comparing': 'Comparing…',
    'compare.ahead': 'ahead',
    'compare.behind': 'behind',
    'compare.commits': 'commits',
    'compare.filesChanged': 'files changed',

    // Blame
    'blame.title': 'Blame',
    'blame.loading': 'Loading blame…',
    'blame.noData': 'No blame data',

    // Repo Settings
    'repoSettings.description': 'Description',
    'repoSettings.homepage': 'Homepage',
    'repoSettings.topics': 'Topics (comma separated)',
    'repoSettings.issues': 'Issues',
    'repoSettings.wiki': 'Wiki',
    'repoSettings.discussions': 'Discussions',
    'repoSettings.save': 'Save changes',
    'repoSettings.archive': 'Archive repo',
    'repoSettings.delete': 'Delete repo',
    'repoSettings.dangerZone': 'Danger zone',

    // Time
    'time.s': 's ago',
    'time.m': 'm ago',
    'time.h': 'h ago',
    'time.d': 'd ago',
    'time.mo': 'mo ago',
    'time.y': 'y ago',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.repos': 'Repos',
    'nav.inbox': 'Bandeja',
    'nav.search': 'Buscar',
    'nav.me': 'Yo',

    // Common
    'common.loading': 'Cargando…',
    'common.refresh': 'Actualizar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Borrar',
    'common.edit': 'Editar',
    'common.create': 'Crear',
    'common.close': 'Cerrar',
    'common.back': 'Volver',
    'common.done': 'Hecho',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.confirm': 'Confirmar',
    'common.search': 'Buscar',
    'common.noResults': 'Sin resultados',
    'common.loadMore': 'Cargar más…',
    'common.noMore': 'No hay más elementos',
    'common.updated': 'Actualizado',
    'common.copied': '¡Copiado!',

    // Auth
    'auth.welcome': 'Bienvenido a OctoMobile',
    'auth.subtitle': 'Tu compañero de GitHub en Android',
    'auth.loginPAT': 'Iniciar con PAT',
    'auth.loginOAuth': 'Iniciar con GitHub',
    'auth.enterToken': 'Ingresa tu token…',
    'auth.invalidToken': 'Token inválido o expirado',
    'auth.logout': 'Cerrar sesión',
    'auth.logoutConfirm': '¿Cerrar sesión?',

    // Home
    'home.greeting': 'Hola',
    'home.activity': 'Resumen de tu actividad',
    'home.quickAccess': 'Acceso rápido',
    'home.notifications': 'Notificaciones',
    'home.recentRepos': 'Repos recientes',
    'home.viewAll': 'Ver todos →',
    'home.activityFeed': 'Actividad',

    // Repo
    'repo.files': 'Archivos',
    'repo.branches': 'Ramas',
    'repo.history': 'Historial',
    'repo.compare': 'Comparar',
    'repo.star': 'Estrella',
    'repo.unstar': 'Sin estrella',
    'repo.fork': 'Fork',
    'repo.open': 'Abrir en navegador',
    'repo.searchInRepo': 'Buscar en repo',
    'repo.settings': 'Configuración',
    'repo.languages': 'Lenguajes',
    'repo.ci': 'CI',
    'repo.lastCommit': 'Último commit',
    'repo.private': 'privado',
    'repo.default': 'predeterminado',

    // Commits
    'commits.title': 'Historial',
    'commits.noMore': 'No hay más commits',

    // Issues
    'issues.title': 'Issues',
    'issues.open': 'abiertos',
    'issues.closed': 'cerrados',
    'issues.all': 'todos',
    'issues.new': 'Nuevo issue',
    'issues.noItems': 'Sin issues',

    // Pull Requests
    'prs.title': 'Pull Requests',
    'prs.new': 'Nuevo PR',
    'prs.merge': 'Merge',
    'prs.squash': 'Squash & merge',
    'prs.rebase': 'Rebase & merge',
    'prs.approve': 'Approve',
    'prs.requestChanges': 'Request changes',
    'prs.comment': 'Comentar',

    // Files
    'files.title': 'Archivos',
    'files.blame': 'Blame',
    'files.wrap': 'Cambiar wrap',
    'files.binary': 'Archivo binario',
    'files.download': 'Descargar',
    'files.search': 'Buscar…',

    // Notifications
    'notifs.title': 'Notificaciones',
    'notifs.unread': 'Sin leer',
    'notifs.all': 'Todas',
    'notifs.markRead': 'Marcar todo como leído',
    'notifs.noItems': 'Sin notificaciones',
    'notifs.upToDate': 'Estás al día',

    // Settings
    'settings.title': 'Ajustes / Cuenta',
    'settings.appearance': 'Apariencia',
    'settings.theme': 'Tema',
    'settings.fontSize': 'Tamaño de fuente',
    'settings.notifications': 'Notificaciones',
    'settings.polling': 'Polling de notificaciones',
    'settings.interval': 'Intervalo (min)',
    'settings.vibration': 'Vibración',
    'settings.rateLimit': 'Rate limit',
    'settings.limit': 'Límite',
    'settings.remaining': 'Restantes',
    'settings.reset': 'Reset',
    'settings.advanced': 'Avanzado',
    'settings.session': 'Sesión',
    'settings.about': 'Acerca de OctoMobile',
    'settings.pinLock': 'Bloqueo PIN',
    'settings.pinLockDesc': 'Requerir PIN para abrir la app',
    'settings.favorites': 'Repos Favoritos',

    // Reset
    'reset.title': 'Git Reset',
    'reset.branch': 'Rama a resetear',
    'reset.selectBranch': 'Selecciona una rama…',
    'reset.currentBranch': 'Rama actual',
    'reset.moveToCommit': 'Se moverá al commit',
    'reset.destructive': 'Operación destructiva',
    'reset.destructiveDesc': 'Los commits posteriores a este punto se perderán de la rama seleccionada. Otros colaboradores pueden verse afectados.',
    'reset.doReset': 'Hacer Git Reset',
    'reset.confirmMsg': 'RESET',
    'reset.confirmText': 'al commit',
    'reset.branchWillMove': 'Esto moverá el puntero de la rama al commit seleccionado. Esto es equivalente a git reset --hard seguido de git push --force.',

    // Compare
    'compare.title': 'Comparar',
    'compare.base': 'Base',
    'compare.head': 'Head',
    'compare.comparing': 'Comparando…',
    'compare.ahead': 'adelante',
    'compare.behind': 'atrás',
    'compare.commits': 'commits',
    'compare.filesChanged': 'archivos cambiados',

    // Blame
    'blame.title': 'Blame',
    'blame.loading': 'Cargando blame…',
    'blame.noData': 'Sin datos de blame',

    // Repo Settings
    'repoSettings.description': 'Descripción',
    'repoSettings.homepage': 'Página web',
    'repoSettings.topics': 'Topics (separados por coma)',
    'repoSettings.issues': 'Issues',
    'repoSettings.wiki': 'Wiki',
    'repoSettings.discussions': 'Discussions',
    'repoSettings.save': 'Guardar cambios',
    'repoSettings.archive': 'Archivar repo',
    'repoSettings.delete': 'Borrar repo',
    'repoSettings.dangerZone': 'Zona peligrosa',

    // Time
    'time.s': 's',
    'time.m': 'm',
    'time.h': 'h',
    'time.d': 'd',
    'time.mo': 'meses',
    'time.y': 'a',
  },
};

export function t(key: string, lang: Lang = 'es'): string {
  return translations[lang]?.[key] || translations['en']?.[key] || key;
}

export function useT(): (key: string) => string {
  const { settings } = useApp();
  const lang = settings.language;
  return (key: string) => t(key, lang);
}

export default translations;
