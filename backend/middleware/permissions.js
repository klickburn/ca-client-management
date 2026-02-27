const User = require('../models/User');
const Client = require('../models/Client');

// Permission map: action → roles allowed
const PERMISSIONS = {
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
    'task:create':         ['partner', 'seniorCA', 'article'],
    'task:edit':           ['partner', 'seniorCA', 'article'],
    'task:delete':         ['partner', 'seniorCA'],
    'billing:create':      ['partner', 'seniorCA'],
    'billing:edit':        ['partner', 'seniorCA'],
    'billing:delete':      ['partner'],
    'activity:view':       ['partner', 'seniorCA'],
};

// Roles that a given role is allowed to create
const CREATION_HIERARCHY = {
    'partner':  ['partner', 'seniorCA', 'article', 'client'],
    'seniorCA': ['article', 'client'],
    'article':  [],
    'client':   [],
};

/**
 * Check if user has permission for a specific action.
 */
const checkPermission = (action) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        const allowedRoles = PERMISSIONS[action];

        if (!allowedRoles || !allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};

/**
 * Middleware to filter client access based on role.
 * Sets req.clientFilter for use in controllers.
 * - partner/seniorCA: see all clients
 * - article: see only assigned clients
 * - client: see only their own linked client
 */
const filterClientAccess = async (req, res, next) => {
    try {
        const { role } = req.user;

        if (role === 'partner' || role === 'seniorCA') {
            req.clientFilter = {};
        } else if (role === 'article') {
            // Get the full user document to read assignedClients
            const user = await User.findById(req.user.id).select('assignedClients');
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }
            req.clientFilter = { _id: { $in: user.assignedClients || [] } };
        } else if (role === 'client') {
            const user = await User.findById(req.user.id).select('clientId');
            if (!user || !user.clientId) {
                return res.status(403).json({ message: 'No client profile linked' });
            }
            req.clientFilter = { _id: user.clientId };
        } else {
            return res.status(403).json({ message: 'Unknown role' });
        }

        next();
    } catch (error) {
        console.error('Error in filterClientAccess:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Check if the current user can create a user with the given role.
 */
const checkCreationHierarchy = (req, res, next) => {
    const creatorRole = req.user.role;
    const targetRole = req.body.role;

    if (!targetRole) {
        return res.status(400).json({ message: 'Role is required' });
    }

    const allowedToCreate = CREATION_HIERARCHY[creatorRole] || [];
    if (!allowedToCreate.includes(targetRole)) {
        return res.status(403).json({
            message: `${creatorRole} cannot create ${targetRole} users`
        });
    }

    next();
};

module.exports = {
    PERMISSIONS,
    CREATION_HIERARCHY,
    checkPermission,
    filterClientAccess,
    checkCreationHierarchy,
};
