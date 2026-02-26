// Client-side permission map — mirrors backend/middleware/permissions.js
export const PERMISSIONS = {
  'client:viewAll':      ['partner', 'seniorCA'],
  'client:viewAssigned': ['article'],
  'client:viewSelf':     ['client'],
  'client:create':       ['partner', 'seniorCA'],
  'client:edit':         ['partner', 'seniorCA'],
  'client:delete':       ['partner'],
  'document:upload':     ['partner', 'seniorCA', 'article', 'client'],
  'document:verify':     ['partner', 'seniorCA'],
  'document:delete':     ['partner'],
  'billing:viewAll':     ['partner', 'seniorCA'],
  'billing:viewOwn':     ['client'],
  'team:manage':         ['partner'],
  'settings:firm':       ['partner'],
  'dashboard:full':      ['partner', 'seniorCA'],
  'dashboard:limited':   ['article'],
  'user:create':         ['partner', 'seniorCA'],
  'user:delete':         ['partner'],
};

export const CREATION_HIERARCHY = {
  partner:  ['partner', 'seniorCA', 'article', 'client'],
  seniorCA: ['article', 'client'],
  article:  [],
  client:   [],
};

export const ROLE_LABELS = {
  partner:  'Partner',
  seniorCA: 'Sr. CA',
  article:  'Article',
  client:   'Client',
};

export function hasPermission(role, action) {
  const allowed = PERMISSIONS[action];
  return allowed ? allowed.includes(role) : false;
}
