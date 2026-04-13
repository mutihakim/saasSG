<?php

return [
    'dashboard' => ['view'],
    'tenant.settings' => ['view', 'manage'],
    'team.members' => ['create', 'view', 'update', 'delete'],
    'team.roles' => ['create', 'view', 'update', 'delete'],
    'team.invitations' => ['create', 'view', 'update'],
    'team.role_permissions' => ['assign'],
    'whatsapp.settings' => ['view', 'update'],
    'whatsapp.chats' => ['view', 'update'],
    'finance' => ['view', 'create', 'update', 'delete'],
    'wallet' => ['view', 'create', 'update', 'delete'],
    'master.categories' => ['view', 'create', 'update', 'delete'],
    'master.tags' => ['view', 'create', 'update', 'delete'],
    'master.currencies' => ['view', 'create', 'update', 'delete'],
    'master.uom' => ['view', 'create', 'update', 'delete'],
    'games.math' => ['view', 'create', 'update'],
    'games.vocabulary' => ['view', 'create', 'update'],
];
